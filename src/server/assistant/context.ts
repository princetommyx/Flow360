import 'server-only';

import { z } from 'zod';

import { db } from '@/lib/db';
import { hasPermission, type PermissionKey } from '@/lib/permissions';
import type { Prisma } from '@/generated/prisma/client';

/**
 * What every tool is handed, and the pieces they all need.
 *
 * Two rules hold across every tool in this directory, and nothing else about
 * the assistant makes sense without them.
 *
 * **It works in names, not ids.** No tool takes an id and none returns one.
 * The model asks for "Adom Fabrics" and a resolver here turns that into a row
 * — or into a list of candidates for it to choose between. A model that never
 * sees an id cannot invent one, and a workspace's identifiers never reach a
 * provider's logs.
 *
 * **It cannot write.** A tool that would change something produces a proposal:
 * the exact input one of our own server actions takes, stored on the server,
 * waiting for a person. What runs on confirmation is the ordinary action, with
 * every rule it already enforces.
 */

export type ToolContext = {
  organizationId: string;
  userId: string;
  permissions: readonly string[];
  currency: string;
  conversationId: string;
  /** The workspace's today, so "this month" means the same thing throughout. */
  now: Date;
};

export type ProposalPreview = {
  title: string;
  subtitle?: string;
  rows: Array<{ label: string; value: string }>;
  lines?: Array<{ label: string; detail?: string; amount: string }>;
  total?: { label: string; value: string };
  /** Anything the person should read before agreeing. */
  warning?: string;
  confirmLabel: string;
};

export type ToolResult =
  /** An answer for the model to use. */
  | { kind: 'data'; data: unknown }
  /** A write, staged. The model is told it is waiting, not that it happened. */
  | { kind: 'proposal'; proposalId: string; preview: ProposalPreview; summary: string }
  /** Something it asked for that cannot be done, phrased for it to act on. */
  | { kind: 'error'; message: string };

export function toolError(message: string): ToolResult {
  return { kind: 'error', message };
}

export function toolData(data: unknown): ToolResult {
  return { kind: 'data', data };
}

export type AssistantTool<S extends z.ZodType = z.ZodType> = {
  name: string;
  description: string;
  schema: S;
  /** Held before the tool runs. Importing the model does not import authority. */
  permission: PermissionKey | PermissionKey[];
  /** True when the tool stages a write rather than answering a question. */
  writes: boolean;
  run(input: z.infer<S>, context: ToolContext): Promise<ToolResult>;
};

/** Keeps the input type flowing from the schema into the handler. */
export function defineTool<S extends z.ZodType>(tool: AssistantTool<S>): AssistantTool {
  return tool as AssistantTool;
}

export function mayUse(tool: AssistantTool, permissions: readonly string[]): boolean {
  return hasPermission(permissions, tool.permission);
}

/* ── Resolving a name ─────────────────────────────────────────────────────── */

export type Resolved<T> = { ok: true; row: T } | { ok: false; message: string };

/**
 * One row from a name.
 *
 * Nothing is guessed. An exact match wins; a single partial match is taken; and
 * anything else comes back as a sentence naming the candidates, which the model
 * reads and puts to the person. "Which Ama did you mean?" is a far better
 * outcome than an invoice addressed to the wrong one.
 */
export function resolveOne<T>(
  rows: T[],
  query: string,
  labelOf: (row: T) => string,
  what: string,
): Resolved<T> {
  if (rows.length === 0) {
    return { ok: false, message: `There is no ${what} matching “${query}” in this workspace.` };
  }

  const needle = query.trim().toLowerCase();
  const exact = rows.filter((row) => labelOf(row).toLowerCase() === needle);
  if (exact.length === 1) return { ok: true, row: exact[0] };

  if (rows.length === 1) return { ok: true, row: rows[0] };

  const names = rows.slice(0, 8).map(labelOf).join(', ');
  return {
    ok: false,
    message: `“${query}” matches more than one ${what}: ${names}${
      rows.length > 8 ? `, and ${rows.length - 8} more` : ''
    }. Ask which one is meant, using the full name.`,
  };
}

export async function resolveCustomer(query: string, context: ToolContext) {
  const rows = await db.customer.findMany({
    where: {
      organizationId: context.organizationId,
      deletedAt: null,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { companyName: { contains: query, mode: 'insensitive' } },
        { email: { equals: query, mode: 'insensitive' } },
      ],
    },
    take: 20,
    select: {
      id: true,
      name: true,
      companyName: true,
      email: true,
      status: true,
      paymentTermDays: true,
    },
  });

  return resolveOne(rows, query, (row) => row.name, 'customer');
}

export async function resolveProduct(query: string, context: ToolContext) {
  const rows = await db.product.findMany({
    where: {
      organizationId: context.organizationId,
      deletedAt: null,
      OR: [
        { sku: { equals: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: 20,
    select: {
      id: true,
      sku: true,
      name: true,
      unit: true,
      sellingPrice: true,
      taxRate: true,
      stockQuantity: true,
      trackInventory: true,
      type: true,
      status: true,
    },
  });

  // A code is exact by nature, so it settles the question before a name does.
  const byCode = rows.filter((row) => row.sku.toLowerCase() === query.trim().toLowerCase());
  if (byCode.length === 1) return { ok: true as const, row: byCode[0] };

  return resolveOne(rows, query, (row) => row.name, 'product');
}

export async function resolveEmployee(query: string, context: ToolContext) {
  const parts = query.trim().split(/\s+/);
  const rows = await db.employee.findMany({
    where: {
      organizationId: context.organizationId,
      deletedAt: null,
      OR: [
        { email: { equals: query, mode: 'insensitive' } },
        { employeeNumber: { equals: query, mode: 'insensitive' } },
        ...parts.map((part) => ({ firstName: { contains: part, mode: 'insensitive' as const } })),
        ...parts.map((part) => ({ lastName: { contains: part, mode: 'insensitive' as const } })),
      ],
    },
    take: 20,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      position: true,
      department: true,
      status: true,
      baseSalary: true,
      employeeNumber: true,
    },
  });

  return resolveOne(rows, query, (row) => `${row.firstName} ${row.lastName}`, 'employee');
}

/* ── Staging a write ──────────────────────────────────────────────────────── */

/**
 * Records what the assistant would do, for somebody to agree to.
 *
 * The input stored here is the server action's own input and has already been
 * through that action's schema, so confirming cannot fail on something the
 * draft could have caught. It is stored rather than returned to the browser
 * because a proposal the client could edit would be no protection at all.
 */
export async function stageProposal(
  context: ToolContext,
  kind: string,
  input: unknown,
  preview: ProposalPreview,
  summary: string,
): Promise<ToolResult> {
  const proposal = await db.assistantProposal.create({
    data: {
      conversationId: context.conversationId,
      organizationId: context.organizationId,
      userId: context.userId,
      kind,
      input: input as Prisma.InputJsonValue,
      preview: preview as unknown as Prisma.InputJsonValue,
    },
    select: { id: true },
  });

  return { kind: 'proposal', proposalId: proposal.id, preview, summary };
}

/** Today in the workspace, as the `YYYY-MM-DD` every schema here expects. */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a date of the form 2026-01-31');
