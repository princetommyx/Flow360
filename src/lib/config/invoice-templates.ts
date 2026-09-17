/**
 * Invoice designs, and which plan opens which.
 *
 * The template is a presentation choice and nothing else: every one of them
 * renders the same document from the same figures, so moving between them can
 * never change what an invoice says. That is what makes it safe to gate on the
 * plan — a workspace that drops to Starter loses a look, not its invoices.
 *
 * `plan` is the cheapest plan a template comes with, and the plans nest, so
 * Business has everything Starter has. Nothing here imports the plan list at
 * runtime; `PlanId` is a type, which keeps the dependency one way and lets the
 * pricing page count templates without a cycle.
 */

import type { PlanId } from '@/lib/config/plans';

export const INVOICE_TEMPLATE_IDS = [
  'classic',
  'compact',
  'modern',
  'elegant',
  'bold',
  'letterhead',
] as const;

export type InvoiceTemplateId = (typeof INVOICE_TEMPLATE_IDS)[number];

export type InvoiceTemplate = {
  id: InvoiceTemplateId;
  name: string;
  /** One line, in front of a person choosing. Says what it looks like. */
  description: string;
  /** The cheapest plan that includes this design. */
  plan: PlanId;
};

/** What a workspace gets before anybody chooses, and the fallback when a
 *  chosen design is no longer included in the plan. */
export const DEFAULT_INVOICE_TEMPLATE: InvoiceTemplateId = 'classic';

export const INVOICE_TEMPLATES: InvoiceTemplate[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Ruled sections and a plain totals block. Reads like an invoice should.',
    plan: 'starter',
  },
  {
    id: 'compact',
    name: 'Compact',
    description: 'Smaller type and tighter rows, for invoices that run to many lines.',
    plan: 'starter',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'A coloured band across the top and the amount due called out beside it.',
    plan: 'business',
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'Serif headings and wide margins. Quiet, and it photographs well.',
    plan: 'business',
  },
  {
    id: 'bold',
    name: 'Bold',
    description: 'The amount due set large at the top, over a dark totals panel.',
    plan: 'business',
  },
  {
    id: 'letterhead',
    name: 'Letterhead',
    description: 'Leaves the top of the page clear, for printing onto your own paper.',
    plan: 'enterprise',
  },
];

/** Plans nest, so a plan includes every design at or below its own rank. */
const RANK: Record<PlanId, number> = { starter: 0, business: 1, enterprise: 2 };

function rankOf(plan: string): number {
  return RANK[plan as PlanId] ?? 0;
}

export function findInvoiceTemplate(
  id: string | null | undefined,
): InvoiceTemplate | undefined {
  return INVOICE_TEMPLATES.find((template) => template.id === id);
}

/** The designs a plan includes, in the order they are shown. */
export function templatesForPlan(plan: string): InvoiceTemplate[] {
  return INVOICE_TEMPLATES.filter((template) => rankOf(template.plan) <= rankOf(plan));
}

/** How many designs a plan includes — the number the pricing page quotes. */
export function templateCountForPlan(plan: string): number {
  return templatesForPlan(plan).length;
}

export function isTemplateAllowed(plan: string, id: string | null | undefined): boolean {
  const template = findInvoiceTemplate(id);
  return template !== undefined && rankOf(template.plan) <= rankOf(plan);
}

/**
 * The design an invoice is actually printed with.
 *
 * A workspace that chose a Business design and later moved to Starter still has
 * that choice on its settings row. Rather than printing something it is no
 * longer paying for — or refusing to print at all — it falls back to the
 * default, and the settings page says so where they chose it.
 */
export function resolveInvoiceTemplate(
  id: string | null | undefined,
  plan: string,
): InvoiceTemplate {
  if (isTemplateAllowed(plan, id)) return findInvoiceTemplate(id)!;
  return findInvoiceTemplate(DEFAULT_INVOICE_TEMPLATE)!;
}
