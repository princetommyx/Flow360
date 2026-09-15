import 'server-only';

import { db } from '@/lib/db';
import { calculateDocumentTotals, round, toNumber } from '@/lib/money';
import {
  orderByFor,
  paginationFor,
  pageInfo,
  type ListQuery,
} from '@/lib/query';
import type { BillInput } from '@/lib/validations/purchasing';
import type { Prisma } from '@/generated/prisma/client';
import type { BillStatus } from '@/generated/prisma/enums';

const SORTABLE: Record<string, Prisma.BillOrderByWithRelationInput> = {
  number: { number: 'asc' },
  issueDate: { issueDate: 'desc' },
  dueDate: { dueDate: 'asc' },
  total: { total: 'desc' },
  balanceDue: { balanceDue: 'desc' },
  status: { status: 'asc' },
};

/** Statuses where money is still owed to the supplier. */
export const OUTSTANDING_STATUSES: BillStatus[] = [
  'AWAITING_PAYMENT',
  'PARTIALLY_PAID',
  'OVERDUE',
];

/** A bill can only be rewritten while it is a draft nobody has paid against. */
export const EDITABLE_STATUSES: BillStatus[] = ['DRAFT'];

export function totalsFor(data: BillInput) {
  return calculateDocumentTotals({
    lines: data.items.map((item) => ({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
    })),
  });
}

/**
 * Where a bill stands once its paid amount changes.
 *
 * Draft and cancelled are decisions someone made, so they are never overridden
 * here; everything else follows from the money and the date.
 */
export function deriveBillStatus(
  current: BillStatus,
  total: number,
  amountPaid: number,
  dueDate: Date,
  now = new Date(),
): BillStatus {
  if (current === 'DRAFT' || current === 'CANCELLED') return current;
  if (amountPaid >= total) return 'PAID';
  if (amountPaid > 0) return 'PARTIALLY_PAID';
  return dueDate < now ? 'OVERDUE' : 'AWAITING_PAYMENT';
}

export function billWhere(
  organizationId: string,
  query: ListQuery,
): Prisma.BillWhereInput {
  const term = query.q.trim();
  const { status, supplierId, range } = query.filters;

  return {
    organizationId,
    deletedAt: null,
    ...(status === 'outstanding'
      ? { status: { in: OUTSTANDING_STATUSES } }
      : status
        ? { status: status as BillStatus }
        : {}),
    ...(supplierId ? { supplierId } : {}),
    ...(range === 'overdue'
      ? { status: { in: OUTSTANDING_STATUSES }, dueDate: { lt: new Date() } }
      : {}),
    ...(term
      ? {
          OR: [
            { number: { contains: term, mode: 'insensitive' } },
            { supplierRef: { contains: term, mode: 'insensitive' } },
            { supplier: { name: { contains: term, mode: 'insensitive' } } },
            { supplier: { companyName: { contains: term, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };
}

export type BillListRow = {
  id: string;
  number: string;
  supplierRef: string | null;
  status: string;
  issueDate: Date;
  dueDate: Date;
  total: number;
  balanceDue: number;
  supplierName: string;
  purchaseOrderNumber: string | null;
  isOverdue: boolean;
};

export async function listBills(organizationId: string, query: ListQuery) {
  const where = billWhere(organizationId, query);
  const now = new Date();

  const [bills, count, totals] = await Promise.all([
    db.bill.findMany({
      where,
      orderBy: orderByFor(query, SORTABLE, { issueDate: 'desc' }),
      ...paginationFor(query),
      select: {
        id: true,
        number: true,
        supplierRef: true,
        status: true,
        issueDate: true,
        dueDate: true,
        total: true,
        balanceDue: true,
        supplier: { select: { name: true, companyName: true } },
        purchaseOrder: { select: { number: true } },
      },
    }),
    db.bill.count({ where }),
    db.bill.aggregate({ where, _sum: { total: true, balanceDue: true } }),
  ]);

  const rows: BillListRow[] = bills.map((bill) => ({
    id: bill.id,
    number: bill.number,
    supplierRef: bill.supplierRef,
    status: bill.status,
    issueDate: bill.issueDate,
    dueDate: bill.dueDate,
    total: toNumber(bill.total),
    balanceDue: toNumber(bill.balanceDue),
    supplierName: bill.supplier.companyName ?? bill.supplier.name,
    purchaseOrderNumber: bill.purchaseOrder?.number ?? null,
    isOverdue:
      OUTSTANDING_STATUSES.includes(bill.status) && bill.dueDate < now,
  }));

  return {
    rows,
    pageInfo: pageInfo(query, count),
    summary: {
      billed: round(toNumber(totals._sum?.total)),
      owed: round(toNumber(totals._sum?.balanceDue)),
    },
  };
}

export async function listBillsForExport(organizationId: string, query: ListQuery) {
  return db.bill.findMany({
    where: billWhere(organizationId, query),
    orderBy: orderByFor(query, SORTABLE, { issueDate: 'desc' }),
    include: {
      supplier: { select: { name: true, companyName: true } },
      purchaseOrder: { select: { number: true } },
    },
    take: 5000,
  });
}

export async function getBill(organizationId: string, id: string) {
  return db.bill.findFirst({
    where: { id, organizationId, deletedAt: null },
    include: {
      supplier: {
        select: {
          id: true,
          name: true,
          companyName: true,
          email: true,
          phone: true,
          addressLine1: true,
          city: true,
          country: true,
        },
      },
      purchaseOrder: { select: { id: true, number: true } },
      items: {
        orderBy: { sortOrder: 'asc' },
        include: { product: { select: { id: true, name: true, sku: true } } },
      },
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
    },
  });
}

/**
 * What is owed, and how much of it is late.
 *
 * Overdue is recomputed from the date rather than trusted from the status,
 * because a bill becomes late by the clock moving, not by anyone acting.
 */
export async function billTotals(organizationId: string, now = new Date()) {
  const outstanding = {
    organizationId,
    deletedAt: null,
    status: { in: OUTSTANDING_STATUSES },
  };

  const [owed, overdue, dueSoon] = await Promise.all([
    db.bill.aggregate({ where: outstanding, _sum: { balanceDue: true }, _count: true }),
    db.bill.aggregate({
      where: { ...outstanding, dueDate: { lt: now } },
      _sum: { balanceDue: true },
      _count: true,
    }),
    db.bill.aggregate({
      where: {
        ...outstanding,
        dueDate: { gte: now, lt: new Date(now.getTime() + 7 * 86_400_000) },
      },
      _sum: { balanceDue: true },
      _count: true,
    }),
  ]);

  return {
    owed: round(toNumber(owed._sum?.balanceDue)),
    owedCount: owed._count,
    overdue: round(toNumber(overdue._sum?.balanceDue)),
    overdueCount: overdue._count,
    dueSoon: round(toNumber(dueSoon._sum?.balanceDue)),
    dueSoonCount: dueSoon._count,
  };
}

/**
 * Moves outstanding bills past their date into OVERDUE.
 *
 * Lateness is a function of the clock, not of anything anyone did, so it is
 * re-derived when the list is opened rather than waiting for a scheduled job
 * this deployment does not have.
 */
export async function refreshOverdueBills(organizationId: string, now = new Date()) {
  await db.bill.updateMany({
    where: {
      organizationId,
      deletedAt: null,
      status: { in: ['AWAITING_PAYMENT', 'PARTIALLY_PAID'] },
      dueDate: { lt: now },
    },
    data: { status: 'OVERDUE' },
  });
}

/** Purchase orders that can still be turned into a bill. */
export async function billablePurchaseOrders(organizationId: string) {
  const orders = await db.purchaseOrder.findMany({
    where: {
      organizationId,
      deletedAt: null,
      status: { in: ['PARTIALLY_RECEIVED', 'RECEIVED'] },
      bills: { none: { deletedAt: null } },
    },
    orderBy: { orderDate: 'desc' },
    select: {
      id: true,
      number: true,
      supplierId: true,
      supplier: { select: { name: true, companyName: true } },
      total: true,
    },
    take: 200,
  });

  return orders.map((order) => ({
    id: order.id,
    number: order.number,
    supplierId: order.supplierId,
    supplierName: order.supplier.companyName ?? order.supplier.name,
    total: toNumber(order.total),
  }));
}
