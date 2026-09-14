import 'server-only';

import { db } from '@/lib/db';
import { round, toNumber } from '@/lib/money';
import {
  orderByFor,
  paginationFor,
  pageInfo,
  type ListQuery,
} from '@/lib/query';
import type { Prisma } from '@/generated/prisma/client';
import type { PaymentMethod } from '@/generated/prisma/enums';

const SORTABLE: Record<string, Prisma.PaymentOrderByWithRelationInput> = {
  number: { number: 'asc' },
  paidAt: { paidAt: 'desc' },
  amount: { amount: 'desc' },
  method: { method: 'asc' },
  customer: { customer: { name: 'asc' } },
};

export function paymentWhere(
  organizationId: string,
  query: ListQuery,
): Prisma.PaymentWhereInput {
  const term = query.q.trim();
  const { method, customerId, accountId } = query.filters;

  return {
    organizationId,
    deletedAt: null,
    // Money in only. Supplier payments belong to the bills side of the ledger.
    direction: 'INCOMING',
    ...(method ? { method: method as PaymentMethod } : {}),
    ...(customerId ? { customerId } : {}),
    ...(accountId ? { accountId } : {}),
    ...(term
      ? {
          OR: [
            { number: { contains: term, mode: 'insensitive' } },
            { reference: { contains: term, mode: 'insensitive' } },
            { invoice: { number: { contains: term, mode: 'insensitive' } } },
            { customer: { name: { contains: term, mode: 'insensitive' } } },
            { customer: { companyName: { contains: term, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };
}

export type PaymentListRow = {
  id: string;
  number: string;
  amount: number;
  method: string;
  paidAt: Date;
  reference: string | null;
  customerId: string | null;
  customerName: string | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
  accountName: string | null;
};

export async function listPayments(organizationId: string, query: ListQuery) {
  const where = paymentWhere(organizationId, query);

  const [payments, count, totals] = await Promise.all([
    db.payment.findMany({
      where,
      orderBy: orderByFor(query, SORTABLE, { paidAt: 'desc' }),
      ...paginationFor(query),
      select: {
        id: true,
        number: true,
        amount: true,
        method: true,
        paidAt: true,
        reference: true,
        customerId: true,
        customer: { select: { name: true, companyName: true } },
        invoice: { select: { id: true, number: true } },
        account: { select: { name: true } },
      },
    }),
    db.payment.count({ where }),
    db.payment.aggregate({ where, _sum: { amount: true } }),
  ]);

  const rows: PaymentListRow[] = payments.map((payment) => ({
    id: payment.id,
    number: payment.number,
    amount: toNumber(payment.amount),
    method: payment.method,
    paidAt: payment.paidAt,
    reference: payment.reference,
    customerId: payment.customerId,
    customerName: payment.customer
      ? (payment.customer.companyName ?? payment.customer.name)
      : null,
    invoiceId: payment.invoice?.id ?? null,
    invoiceNumber: payment.invoice?.number ?? null,
    accountName: payment.account?.name ?? null,
  }));

  return {
    rows,
    pageInfo: pageInfo(query, count),
    summary: { received: round(toNumber(totals._sum.amount)) },
  };
}

export async function listPaymentsForExport(
  organizationId: string,
  query: ListQuery,
) {
  return db.payment.findMany({
    where: paymentWhere(organizationId, query),
    orderBy: orderByFor(query, SORTABLE, { paidAt: 'desc' }),
    include: {
      customer: { select: { name: true, companyName: true } },
      invoice: { select: { number: true } },
      account: { select: { name: true } },
    },
    take: 5000,
  });
}

/** Money received this month and last, for the page's two headline figures. */
export async function paymentTotals(organizationId: string, now = new Date()) {
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [thisMonth, lastMonth] = await Promise.all([
    db.payment.aggregate({
      where: {
        organizationId,
        deletedAt: null,
        direction: 'INCOMING',
        paidAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),
    db.payment.aggregate({
      where: {
        organizationId,
        deletedAt: null,
        direction: 'INCOMING',
        paidAt: { gte: startOfLastMonth, lt: startOfMonth },
      },
      _sum: { amount: true },
    }),
  ]);

  return {
    thisMonth: round(toNumber(thisMonth._sum?.amount)),
    lastMonth: round(toNumber(lastMonth._sum?.amount)),
  };
}
