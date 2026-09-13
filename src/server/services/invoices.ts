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
import type { InvoiceStatus } from '@/generated/prisma/enums';

const SORTABLE: Record<string, Prisma.InvoiceOrderByWithRelationInput> = {
  number: { number: 'asc' },
  issueDate: { issueDate: 'desc' },
  dueDate: { dueDate: 'asc' },
  total: { total: 'desc' },
  balanceDue: { balanceDue: 'desc' },
  status: { status: 'asc' },
  customer: { customer: { name: 'asc' } },
};

/** Statuses that represent a live receivable. */
export const OPEN_STATUSES: InvoiceStatus[] = [
  'SENT',
  'VIEWED',
  'PARTIALLY_PAID',
  'OVERDUE',
];

export function invoiceWhere(
  organizationId: string,
  query: ListQuery,
): Prisma.InvoiceWhereInput {
  const term = query.q.trim();
  const { status, customerId, range } = query.filters;

  const now = new Date();
  const dateFilter =
    range === 'overdue'
      ? { dueDate: { lt: now }, status: { in: OPEN_STATUSES } }
      : range === 'open'
        ? { status: { in: OPEN_STATUSES } }
        : {};

  return {
    organizationId,
    deletedAt: null,
    ...(status ? { status: status as InvoiceStatus } : {}),
    ...(customerId ? { customerId } : {}),
    ...dateFilter,
    ...(term
      ? {
          OR: [
            { number: { contains: term, mode: 'insensitive' } },
            { reference: { contains: term, mode: 'insensitive' } },
            { customer: { name: { contains: term, mode: 'insensitive' } } },
            { customer: { companyName: { contains: term, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };
}

export type InvoiceListRow = {
  id: string;
  number: string;
  status: string;
  issueDate: Date;
  dueDate: Date;
  total: number;
  balanceDue: number;
  customerId: string;
  customerName: string;
  isOverdue: boolean;
};

export async function listInvoices(organizationId: string, query: ListQuery) {
  const where = invoiceWhere(organizationId, query);

  const [invoices, total, totals] = await Promise.all([
    db.invoice.findMany({
      where,
      orderBy: orderByFor(query, SORTABLE, { issueDate: 'desc' }),
      ...paginationFor(query),
      select: {
        id: true,
        number: true,
        status: true,
        issueDate: true,
        dueDate: true,
        total: true,
        balanceDue: true,
        customerId: true,
        customer: { select: { name: true, companyName: true } },
      },
    }),
    db.invoice.count({ where }),
    db.invoice.aggregate({ where, _sum: { total: true, balanceDue: true } }),
  ]);

  const now = new Date();

  const rows: InvoiceListRow[] = invoices.map((invoice) => ({
    id: invoice.id,
    number: invoice.number,
    status: invoice.status,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    total: toNumber(invoice.total),
    balanceDue: toNumber(invoice.balanceDue),
    customerId: invoice.customerId,
    customerName: invoice.customer.companyName ?? invoice.customer.name,
    isOverdue:
      invoice.dueDate < now &&
      OPEN_STATUSES.includes(invoice.status as InvoiceStatus),
  }));

  return {
    rows,
    pageInfo: pageInfo(query, total),
    summary: {
      invoiced: round(toNumber(totals._sum.total)),
      outstanding: round(toNumber(totals._sum.balanceDue)),
    },
  };
}

export async function listInvoicesForExport(
  organizationId: string,
  query: ListQuery,
) {
  return db.invoice.findMany({
    where: invoiceWhere(organizationId, query),
    orderBy: orderByFor(query, SORTABLE, { issueDate: 'desc' }),
    include: { customer: { select: { name: true, companyName: true } } },
    take: 5000,
  });
}

export async function getInvoice(organizationId: string, id: string) {
  return db.invoice.findFirst({
    where: { id, organizationId, deletedAt: null },
    include: {
      customer: true,
      items: { orderBy: { sortOrder: 'asc' } },
      payments: {
        where: { deletedAt: null },
        orderBy: { paidAt: 'desc' },
        select: {
          id: true,
          number: true,
          amount: true,
          method: true,
          paidAt: true,
          reference: true,
          account: { select: { name: true } },
        },
      },
      quotation: { select: { id: true, number: true } },
    },
  });
}

/**
 * Recomputes an invoice's stored totals from its lines.
 *
 * Every write path calls this rather than trusting numbers from the client, so
 * a tampered payload cannot produce an invoice whose total disagrees with the
 * sum of what is on it.
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
  shippingAmount?: number;
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
    shippingAmount: input.shippingAmount,
  });
}

/**
 * The status an invoice should hold given what has been paid and the date.
 * Draft and cancelled are terminal for this purpose and never recomputed.
 */
export function deriveStatus(
  current: InvoiceStatus,
  total: number,
  amountPaid: number,
  dueDate: Date,
  now = new Date(),
): InvoiceStatus {
  if (current === 'DRAFT' || current === 'CANCELLED') return current;
  if (amountPaid >= total && total > 0) return 'PAID';
  if (amountPaid > 0) return 'PARTIALLY_PAID';
  if (dueDate < now) return 'OVERDUE';
  return current === 'OVERDUE' ? 'SENT' : current;
}

export async function invoiceStatusCounts(organizationId: string) {
  const rows = await db.invoice.groupBy({
    by: ['status'],
    where: { organizationId, deletedAt: null },
    _count: { _all: true },
  });
  return Object.fromEntries(rows.map((row) => [row.status, row._count._all]));
}
