import 'server-only';

import { db } from '@/lib/db';
import { calculateDocumentTotals, round, toNumber } from '@/lib/money';
import {
  orderByFor,
  paginationFor,
  pageInfo,
  type ListQuery,
} from '@/lib/query';
import type { Prisma } from '@/generated/prisma/client';
import type { QuotationStatus } from '@/generated/prisma/enums';

const SORTABLE: Record<string, Prisma.QuotationOrderByWithRelationInput> = {
  number: { number: 'asc' },
  issueDate: { issueDate: 'desc' },
  expiryDate: { expiryDate: 'asc' },
  total: { total: 'desc' },
  status: { status: 'asc' },
  customer: { customer: { name: 'asc' } },
};

/** Statuses where the customer has not yet decided, so the clock is running. */
export const PENDING_STATUSES: QuotationStatus[] = ['SENT'];

/** Statuses that can still be edited or withdrawn. */
export const OPEN_STATUSES: QuotationStatus[] = ['DRAFT', 'SENT'];

export function quotationWhere(
  organizationId: string,
  query: ListQuery,
): Prisma.QuotationWhereInput {
  const term = query.q.trim();
  const { status, customerId, range } = query.filters;

  const now = new Date();
  const dateFilter =
    range === 'expiring'
      ? { expiryDate: { lt: now }, status: { in: PENDING_STATUSES } }
      : range === 'open'
        ? { status: { in: OPEN_STATUSES } }
        : {};

  return {
    organizationId,
    deletedAt: null,
    ...(status ? { status: status as QuotationStatus } : {}),
    ...(customerId ? { customerId } : {}),
    ...dateFilter,
    ...(term
      ? {
          OR: [
            { number: { contains: term, mode: 'insensitive' } },
            { customer: { name: { contains: term, mode: 'insensitive' } } },
            { customer: { companyName: { contains: term, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };
}

export type QuotationListRow = {
  id: string;
  number: string;
  status: string;
  issueDate: Date;
  expiryDate: Date;
  total: number;
  customerId: string;
  customerName: string;
  /** Past its expiry date while still awaiting an answer. */
  hasLapsed: boolean;
  invoiceId: string | null;
  invoiceNumber: string | null;
};

export async function listQuotations(organizationId: string, query: ListQuery) {
  const where = quotationWhere(organizationId, query);

  const [quotations, count, totals, accepted] = await Promise.all([
    db.quotation.findMany({
      where,
      orderBy: orderByFor(query, SORTABLE, { issueDate: 'desc' }),
      ...paginationFor(query),
      select: {
        id: true,
        number: true,
        status: true,
        issueDate: true,
        expiryDate: true,
        total: true,
        customerId: true,
        customer: { select: { name: true, companyName: true } },
        invoice: { select: { id: true, number: true } },
      },
    }),
    db.quotation.count({ where }),
    db.quotation.aggregate({ where, _sum: { total: true } }),
    db.quotation.aggregate({
      where: { ...where, status: { in: ['ACCEPTED', 'CONVERTED'] } },
      _sum: { total: true },
    }),
  ]);

  const now = new Date();

  const rows: QuotationListRow[] = quotations.map((quotation) => ({
    id: quotation.id,
    number: quotation.number,
    status: quotation.status,
    issueDate: quotation.issueDate,
    expiryDate: quotation.expiryDate,
    total: toNumber(quotation.total),
    customerId: quotation.customerId,
    customerName: quotation.customer.companyName ?? quotation.customer.name,
    hasLapsed:
      quotation.expiryDate < now &&
      PENDING_STATUSES.includes(quotation.status as QuotationStatus),
    invoiceId: quotation.invoice?.id ?? null,
    invoiceNumber: quotation.invoice?.number ?? null,
  }));

  return {
    rows,
    pageInfo: pageInfo(query, count),
    summary: {
      quoted: round(toNumber(totals._sum.total)),
      won: round(toNumber(accepted._sum.total)),
    },
  };
}

export async function listQuotationsForExport(
  organizationId: string,
  query: ListQuery,
) {
  return db.quotation.findMany({
    where: quotationWhere(organizationId, query),
    orderBy: orderByFor(query, SORTABLE, { issueDate: 'desc' }),
    include: {
      customer: { select: { name: true, companyName: true } },
      invoice: { select: { number: true } },
    },
    take: 5000,
  });
}

export async function getQuotation(organizationId: string, id: string) {
  return db.quotation.findFirst({
    where: { id, organizationId, deletedAt: null },
    include: {
      customer: true,
      items: { orderBy: { sortOrder: 'asc' } },
      invoice: { select: { id: true, number: true, status: true } },
    },
  });
}

/**
 * Recomputes a quotation's stored totals from its lines.
 *
 * Shares `calculateDocumentTotals` with invoices, so a quote and the invoice
 * it converts into cannot disagree about the arithmetic. Quotations carry no
 * shipping line, hence no shipping argument.
 */
export function totalsFor(input: {
  items: Array<{
    quantity: number;
    unitPrice: number;
    discountRate: number;
    taxRate: number;
  }>;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
}) {
  return calculateDocumentTotals({
    lines: input.items.map((item) => ({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discountRate: item.discountRate,
      taxRate: item.taxRate,
    })),
    discountType: input.discountType,
    discountValue: input.discountValue,
  });
}

/**
 * Marks quotations that have sailed past their expiry date without an answer.
 *
 * Expiry is a function of the date rather than of anything anyone did, so it is
 * re-derived when the list is opened rather than needing a scheduled job.
 */
export async function refreshExpiredQuotations(organizationId: string) {
  await db.quotation.updateMany({
    where: {
      organizationId,
      deletedAt: null,
      status: { in: PENDING_STATUSES },
      expiryDate: { lt: new Date() },
    },
    data: { status: 'EXPIRED' },
  });
}

export async function quotationStatusCounts(organizationId: string) {
  const rows = await db.quotation.groupBy({
    by: ['status'],
    where: { organizationId, deletedAt: null },
    _count: { _all: true },
  });
  return Object.fromEntries(rows.map((row) => [row.status, row._count._all]));
}
