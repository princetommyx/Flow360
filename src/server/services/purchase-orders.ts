import 'server-only';

import { db } from '@/lib/db';
import { calculateDocumentTotals, round, toNumber } from '@/lib/money';
import {
  orderByFor,
  paginationFor,
  pageInfo,
  type ListQuery,
} from '@/lib/query';
import type { PurchaseOrderInput } from '@/lib/validations/purchasing';
import type { Prisma } from '@/generated/prisma/client';
import type { PurchaseOrderStatus } from '@/generated/prisma/enums';

const SORTABLE: Record<string, Prisma.PurchaseOrderOrderByWithRelationInput> = {
  number: { number: 'asc' },
  orderDate: { orderDate: 'desc' },
  expectedDate: { expectedDate: 'asc' },
  total: { total: 'desc' },
  status: { status: 'asc' },
};

/** Statuses where the order is still expected to arrive. */
export const OPEN_STATUSES: PurchaseOrderStatus[] = [
  'SENT',
  'CONFIRMED',
  'PARTIALLY_RECEIVED',
];

/** Statuses a purchase order can still be edited in. */
export const EDITABLE_STATUSES: PurchaseOrderStatus[] = ['DRAFT', 'SENT'];

export function totalsFor(data: PurchaseOrderInput) {
  return calculateDocumentTotals({
    lines: data.items.map((item) => ({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxRate: item.taxRate,
    })),
    discountType: 'FIXED',
    discountValue: data.discountAmount,
  });
}

export function purchaseOrderWhere(
  organizationId: string,
  query: ListQuery,
): Prisma.PurchaseOrderWhereInput {
  const term = query.q.trim();
  const { status, supplierId } = query.filters;

  return {
    organizationId,
    deletedAt: null,
    ...(status === 'open'
      ? { status: { in: OPEN_STATUSES } }
      : status
        ? { status: status as PurchaseOrderStatus }
        : {}),
    ...(supplierId ? { supplierId } : {}),
    ...(term
      ? {
          OR: [
            { number: { contains: term, mode: 'insensitive' } },
            { notes: { contains: term, mode: 'insensitive' } },
            { supplier: { name: { contains: term, mode: 'insensitive' } } },
            { supplier: { companyName: { contains: term, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };
}

export type PurchaseOrderListRow = {
  id: string;
  number: string;
  status: string;
  orderDate: Date;
  expectedDate: Date | null;
  total: number;
  supplierName: string;
  itemCount: number;
  /** 0–100, how much of the order has physically arrived. */
  receivedPercent: number;
  billed: boolean;
};

export async function listPurchaseOrders(
  organizationId: string,
  query: ListQuery,
) {
  const where = purchaseOrderWhere(organizationId, query);

  const [orders, count, totals] = await Promise.all([
    db.purchaseOrder.findMany({
      where,
      orderBy: orderByFor(query, SORTABLE, { orderDate: 'desc' }),
      ...paginationFor(query),
      select: {
        id: true,
        number: true,
        status: true,
        orderDate: true,
        expectedDate: true,
        total: true,
        supplier: { select: { name: true, companyName: true } },
        items: { select: { quantity: true, receivedQuantity: true } },
        _count: { select: { bills: true } },
      },
    }),
    db.purchaseOrder.count({ where }),
    db.purchaseOrder.aggregate({ where, _sum: { total: true } }),
  ]);

  const rows: PurchaseOrderListRow[] = orders.map((order) => {
    const ordered = order.items.reduce((sum, item) => sum + toNumber(item.quantity), 0);
    const received = order.items.reduce(
      (sum, item) => sum + toNumber(item.receivedQuantity),
      0,
    );

    return {
      id: order.id,
      number: order.number,
      status: order.status,
      orderDate: order.orderDate,
      expectedDate: order.expectedDate,
      total: toNumber(order.total),
      supplierName: order.supplier.companyName ?? order.supplier.name,
      itemCount: order.items.length,
      receivedPercent: ordered > 0 ? Math.min(100, Math.round((received / ordered) * 100)) : 0,
      billed: order._count.bills > 0,
    };
  });

  return {
    rows,
    pageInfo: pageInfo(query, count),
    summary: { ordered: round(toNumber(totals._sum?.total)) },
  };
}

export async function listPurchaseOrdersForExport(
  organizationId: string,
  query: ListQuery,
) {
  return db.purchaseOrder.findMany({
    where: purchaseOrderWhere(organizationId, query),
    orderBy: orderByFor(query, SORTABLE, { orderDate: 'desc' }),
    include: {
      supplier: { select: { name: true, companyName: true } },
      _count: { select: { items: true, bills: true } },
    },
    take: 5000,
  });
}

export async function getPurchaseOrder(organizationId: string, id: string) {
  return db.purchaseOrder.findFirst({
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
      items: {
        orderBy: { sortOrder: 'asc' },
        include: { product: { select: { id: true, name: true, sku: true } } },
      },
      bills: {
        where: { deletedAt: null },
        select: { id: true, number: true, status: true, total: true },
        orderBy: { issueDate: 'desc' },
      },
    },
  });
}

/** Open orders and what is due to arrive, for the page header. */
export async function purchaseOrderTotals(organizationId: string, now = new Date()) {
  const base = { organizationId, deletedAt: null };

  const [open, awaitingBill, overdue] = await Promise.all([
    db.purchaseOrder.aggregate({
      where: { ...base, status: { in: OPEN_STATUSES } },
      _sum: { total: true },
      _count: true,
    }),
    db.purchaseOrder.aggregate({
      where: { ...base, status: 'RECEIVED' },
      _sum: { total: true },
      _count: true,
    }),
    db.purchaseOrder.count({
      where: {
        ...base,
        status: { in: OPEN_STATUSES },
        expectedDate: { lt: now },
      },
    }),
  ]);

  return {
    openValue: round(toNumber(open._sum?.total)),
    openCount: open._count,
    awaitingBillValue: round(toNumber(awaitingBill._sum?.total)),
    awaitingBillCount: awaitingBill._count,
    overdueCount: overdue,
  };
}

export async function supplierOptions(organizationId: string) {
  const suppliers = await db.supplier.findMany({
    where: { organizationId, deletedAt: null, status: { not: 'BLOCKED' } },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, companyName: true },
    take: 500,
  });

  return suppliers.map((supplier) => ({
    id: supplier.id,
    label: supplier.companyName ?? supplier.name,
  }));
}
