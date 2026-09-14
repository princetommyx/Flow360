import 'server-only';

import { db } from '@/lib/db';
import { toNumber, round } from '@/lib/money';
import {
  orderByFor,
  paginationFor,
  pageInfo,
  searchFilter,
  type ListQuery,
} from '@/lib/query';
import type { Prisma } from '@/generated/prisma/client';

const SEARCH_FIELDS = ['name', 'companyName', 'email', 'phone', 'city'] as const;

const SORTABLE: Record<string, Prisma.SupplierOrderByWithRelationInput> = {
  name: { name: 'asc' },
  companyName: { companyName: 'asc' },
  city: { city: 'asc' },
  createdAt: { createdAt: 'desc' },
  status: { status: 'asc' },
};

export function supplierWhere(
  organizationId: string,
  query: ListQuery,
): Prisma.SupplierWhereInput {
  const search = searchFilter(query.q, SEARCH_FIELDS);
  return {
    organizationId,
    deletedAt: null,
    ...(query.filters.status ? { status: query.filters.status as never } : {}),
    ...(search ? { OR: search } : {}),
  };
}

export type SupplierListRow = {
  id: string;
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  status: string;
  paymentTermDays: number;
  createdAt: Date;
  billCount: number;
  totalBilled: number;
  owed: number;
};

/**
 * One page of suppliers with what you owe them.
 *
 * The totals come from a single grouped aggregate rather than a query per row,
 * so the page cost stays flat as the list grows.
 */
export async function listSuppliers(organizationId: string, query: ListQuery) {
  const where = supplierWhere(organizationId, query);

  const [suppliers, total] = await Promise.all([
    db.supplier.findMany({
      where,
      orderBy: orderByFor(query, SORTABLE, { createdAt: 'desc' }),
      ...paginationFor(query),
      select: {
        id: true,
        name: true,
        companyName: true,
        email: true,
        phone: true,
        city: true,
        status: true,
        paymentTermDays: true,
        createdAt: true,
      },
    }),
    db.supplier.count({ where }),
  ]);

  const aggregates = suppliers.length
    ? await db.bill.groupBy({
        by: ['supplierId'],
        where: {
          organizationId,
          deletedAt: null,
          supplierId: { in: suppliers.map((supplier) => supplier.id) },
        },
        _count: { _all: true },
        _sum: { total: true, balanceDue: true },
      })
    : [];

  const bySupplier = new Map(aggregates.map((row) => [row.supplierId, row]));

  const rows: SupplierListRow[] = suppliers.map((supplier) => {
    const aggregate = bySupplier.get(supplier.id);
    return {
      ...supplier,
      billCount: aggregate?._count._all ?? 0,
      totalBilled: round(toNumber(aggregate?._sum.total)),
      owed: round(toNumber(aggregate?._sum.balanceDue)),
    };
  });

  return { rows, pageInfo: pageInfo(query, total) };
}

/** Every matching supplier, unpaginated — used by the CSV export route. */
export async function listSuppliersForExport(
  organizationId: string,
  query: ListQuery,
) {
  return db.supplier.findMany({
    where: supplierWhere(organizationId, query),
    orderBy: orderByFor(query, SORTABLE, { createdAt: 'desc' }),
    take: 5000,
  });
}

export async function getSupplier(organizationId: string, id: string) {
  return db.supplier.findFirst({
    where: { id, organizationId, deletedAt: null },
  });
}

export type SupplierSummary = {
  totalBilled: number;
  totalPaid: number;
  owed: number;
  billCount: number;
  openPurchaseOrders: number;
  lastBillAt: Date | null;
};

export async function getSupplierSummary(
  organizationId: string,
  supplierId: string,
): Promise<SupplierSummary> {
  const [bills, openPurchaseOrders, latest] = await Promise.all([
    db.bill.aggregate({
      where: { organizationId, supplierId, deletedAt: null },
      _count: { _all: true },
      _sum: { total: true, amountPaid: true, balanceDue: true },
    }),
    db.purchaseOrder.count({
      where: {
        organizationId,
        supplierId,
        deletedAt: null,
        status: { in: ['DRAFT', 'SENT', 'PARTIALLY_RECEIVED'] },
      },
    }),
    db.bill.findFirst({
      where: { organizationId, supplierId, deletedAt: null },
      orderBy: { issueDate: 'desc' },
      select: { issueDate: true },
    }),
  ]);

  return {
    totalBilled: round(toNumber(bills._sum?.total)),
    totalPaid: round(toNumber(bills._sum?.amountPaid)),
    owed: round(toNumber(bills._sum?.balanceDue)),
    billCount: bills._count?._all ?? 0,
    openPurchaseOrders,
    lastBillAt: latest?.issueDate ?? null,
  };
}

/** Lightweight options for the supplier pickers on bills, POs and expenses. */
export async function supplierOptions(organizationId: string) {
  return db.supplier.findMany({
    where: { organizationId, deletedAt: null, status: { not: 'BLOCKED' } },
    orderBy: [{ companyName: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      companyName: true,
      email: true,
      paymentTermDays: true,
    },
    take: 1000,
  });
}
