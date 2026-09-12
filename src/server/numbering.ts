import 'server-only';

import type { Prisma } from '@/generated/prisma/client';

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

  const sequence = await tx.numberSequence.upsert({
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

  const serial = String(sequence.current).padStart(padding, '0');
  return includeYear ? `${prefix}-${year}-${serial}` : `${prefix}-${serial}`;
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
