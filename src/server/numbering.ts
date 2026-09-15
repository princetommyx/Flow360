// Pure transaction helpers with no request context, so the seed script can use
// the same implementation the application does. Deliberately not `server-only`.
import type { Prisma } from '@/generated/prisma/client';
import { formatDocumentNumber } from '@/lib/document-number';

export type DocType =
  | 'invoice'
  | 'quotation'
  | 'payment'
  | 'purchase_order'
  | 'bill'
  | 'expense'
  | 'payroll'
  | 'project';

const DEFAULT_PREFIX: Record<DocType, string> = {
  invoice: 'INV',
  quotation: 'QTE',
  payment: 'PAY',
  purchase_order: 'PO',
  bill: 'BILL',
  expense: 'EXP',
  payroll: 'PR',
  project: 'PRJ',
};

/**
 * Mints the next human-readable document number, e.g. `INV-2026-00001`.
 *
 * The counter is a per-organization row updated with an atomic `increment`
 * inside the caller's transaction, so concurrent creates can never collide.
 */
export async function nextDocumentNumber(
  tx: Prisma.TransactionClient,
  organizationId: string,
  docType: DocType,
  options?: { prefix?: string; padding?: number; includeYear?: boolean; date?: Date },
): Promise<string> {
  const date = options?.date ?? new Date();
  const year = date.getFullYear();

  let sequence = await tx.numberSequence.upsert({
    where: { organizationId_docType_year: { organizationId, docType, year } },
    create: { organizationId, docType, year, current: 1 },
    update: { current: { increment: 1 } },
    select: { current: true },
  });

  const settings = await tx.companySettings.findUnique({
    where: { organizationId },
    select: {
      invoicePrefix: true,
      quotationPrefix: true,
      paymentPrefix: true,
      purchaseOrderPrefix: true,
      numberPadding: true,
      numberIncludeYear: true,
    },
  });

  const configuredPrefix =
    docType === 'invoice'
      ? settings?.invoicePrefix
      : docType === 'quotation'
        ? settings?.quotationPrefix
        : docType === 'payment'
          ? settings?.paymentPrefix
          : docType === 'purchase_order'
            ? settings?.purchaseOrderPrefix
            : undefined;

  const prefix = options?.prefix ?? configuredPrefix ?? DEFAULT_PREFIX[docType];
  const padding = options?.padding ?? settings?.numberPadding ?? 5;
  const includeYear = options?.includeYear ?? settings?.numberIncludeYear ?? true;

  const format = (value: number) =>
    formatDocumentNumber({ prefix, year, serial: value, padding, includeYear });

  // The counter is the source of truth, but rows can be introduced by other
  // means — a migration, an import, a seed — leaving it behind the numbers
  // actually in use. Rather than failing on the unique constraint, advance past
  // anything already taken so the sequence self-heals on first use.
  let candidate = format(sequence.current);
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (!(await isTaken(tx, organizationId, docType, candidate))) return candidate;

    sequence = await tx.numberSequence.update({
      where: { organizationId_docType_year: { organizationId, docType, year } },
      data: { current: { increment: 1 } },
      select: { current: true },
    });
    candidate = format(sequence.current);
  }

  throw new Error(
    `Could not allocate a free ${docType} number after 50 attempts (last tried ${candidate}).`,
  );
}

/** Checks the table that actually owns this document type's numbers. */
async function isTaken(
  tx: Prisma.TransactionClient,
  organizationId: string,
  docType: DocType,
  number: string,
): Promise<boolean> {
  const where = { organizationId, number };
  switch (docType) {
    case 'invoice':
      return Boolean(await tx.invoice.findFirst({ where, select: { id: true } }));
    case 'quotation':
      return Boolean(await tx.quotation.findFirst({ where, select: { id: true } }));
    case 'payment':
      return Boolean(await tx.payment.findFirst({ where, select: { id: true } }));
    case 'purchase_order':
      return Boolean(await tx.purchaseOrder.findFirst({ where, select: { id: true } }));
    case 'bill':
      return Boolean(await tx.bill.findFirst({ where, select: { id: true } }));
    case 'expense':
      return Boolean(await tx.expense.findFirst({ where, select: { id: true } }));
    case 'payroll':
      return Boolean(await tx.payroll.findFirst({ where, select: { id: true } }));
    case 'project':
      return false;
    default:
      return false;
  }
}

/** Preview of the next number, used to show the format in settings. */
export function previewNumber(
  prefix: string,
  padding: number,
  includeYear: boolean,
  sample = 1,
) {
  const serial = String(sample).padStart(Math.max(1, padding), '0');
  return includeYear
    ? `${prefix}-${new Date().getFullYear()}-${serial}`
    : `${prefix}-${serial}`;
}
