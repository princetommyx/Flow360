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

const SORTABLE: Record<string, Prisma.CustomerOrderByWithRelationInput> = {
  name: { name: 'asc' },
  companyName: { companyName: 'asc' },
  city: { city: 'asc' },
  createdAt: { createdAt: 'desc' },
  status: { status: 'asc' },
};

export function customerWhere(
  organizationId: string,
  query: ListQuery,
): Prisma.CustomerWhereInput {
  const search = searchFilter(query.q, SEARCH_FIELDS);
  return {
    organizationId,
    deletedAt: null,
    ...(query.filters.status ? { status: query.filters.status as never } : {}),
    ...(search ? { OR: search } : {}),
  };
}

export type CustomerListRow = {
  id: string;
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  status: string;
  createdAt: Date;
  invoiceCount: number;
  totalInvoiced: number;
  outstanding: number;
};

/**
 * One page of customers with their trading totals.
 *
 * Totals come from two grouped aggregates rather than a per-row query, so the
 * page cost stays flat as the list grows.
 */
export async function listCustomers(organizationId: string, query: ListQuery) {
  const where = customerWhere(organizationId, query);

  const [customers, total] = await Promise.all([
    db.customer.findMany({
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
        createdAt: true,
      },
    }),
    db.customer.count({ where }),
  ]);

  const ids = customers.map((customer) => customer.id);
  const totals = ids.length
    ? await db.invoice.groupBy({
        by: ['customerId'],
        where: {
          organizationId,
          deletedAt: null,
          customerId: { in: ids },
          status: { notIn: ['DRAFT', 'CANCELLED'] },
        },
        _count: { _all: true },
        _sum: { total: true, balanceDue: true },
      })
    : [];

  const totalsById = new Map(totals.map((row) => [row.customerId, row]));

  const rows: CustomerListRow[] = customers.map((customer) => {
    const aggregate = totalsById.get(customer.id);
    return {
      ...customer,
      invoiceCount: aggregate?._count._all ?? 0,
      totalInvoiced: round(toNumber(aggregate?._sum.total)),
      outstanding: round(toNumber(aggregate?._sum.balanceDue)),
    };
  });

  return { rows, pageInfo: pageInfo(query, total) };
}

/** Every matching customer, unpaginated — used by the CSV export route. */
export async function listCustomersForExport(
  organizationId: string,
  query: ListQuery,
) {
  return db.customer.findMany({
    where: customerWhere(organizationId, query),
    orderBy: orderByFor(query, SORTABLE, { createdAt: 'desc' }),
    take: 5000,
  });
}

export async function getCustomer(organizationId: string, id: string) {
  return db.customer.findFirst({
    where: { id, organizationId, deletedAt: null },
  });
}

export type CustomerSummary = {
  totalInvoiced: number;
  totalPaid: number;
  outstanding: number;
  overdue: number;
  invoiceCount: number;
  openQuotations: number;
  lastInvoiceAt: Date | null;
};

export async function getCustomerSummary(
  organizationId: string,
  customerId: string,
): Promise<CustomerSummary> {
  const [invoiced, paid, overdue, openQuotations, latest] = await Promise.all([
    db.invoice.aggregate({
      where: {
        organizationId,
        customerId,
        deletedAt: null,
        status: { notIn: ['DRAFT', 'CANCELLED'] },
      },
      _count: { _all: true },
      _sum: { total: true, balanceDue: true },
    }),
    db.payment.aggregate({
      where: { organizationId, customerId, deletedAt: null, direction: 'INCOMING' },
      _sum: { amount: true },
    }),
    db.invoice.aggregate({
      where: {
        organizationId,
        customerId,
        deletedAt: null,
        status: { in: ['SENT', 'VIEWED', 'PARTIALLY_PAID', 'OVERDUE'] },
        dueDate: { lt: new Date() },
      },
      _sum: { balanceDue: true },
    }),
    db.quotation.count({
      where: {
        organizationId,
        customerId,
        deletedAt: null,
        status: { in: ['DRAFT', 'SENT'] },
      },
    }),
    db.invoice.findFirst({
      where: { organizationId, customerId, deletedAt: null },
      orderBy: { issueDate: 'desc' },
      select: { issueDate: true },
    }),
  ]);

  return {
    totalInvoiced: round(toNumber(invoiced._sum.total)),
    totalPaid: round(toNumber(paid._sum.amount)),
    outstanding: round(toNumber(invoiced._sum.balanceDue)),
    overdue: round(toNumber(overdue._sum.balanceDue)),
    invoiceCount: invoiced._count._all,
    openQuotations,
    lastInvoiceAt: latest?.issueDate ?? null,
  };
}

/** Lightweight options for the customer picker on documents. */
export async function customerOptions(organizationId: string) {
  return db.customer.findMany({
    where: { organizationId, deletedAt: null, status: { not: 'BLOCKED' } },
    orderBy: { name: 'asc' },
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
