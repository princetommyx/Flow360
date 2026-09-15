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
import type { TransactionType } from '@/generated/prisma/enums';

const SORTABLE: Record<string, Prisma.TransactionOrderByWithRelationInput> = {
  occurredAt: { occurredAt: 'desc' },
  amount: { amount: 'desc' },
  description: { description: 'asc' },
  type: { type: 'asc' },
};

/**
 * The cash ledger.
 *
 * One row per money movement, signed relative to the account it touches: money
 * in is positive, money out is negative. A transfer writes a single row on the
 * source account with `toAccountId` set, so the pair is never half-recorded.
 */
export function transactionWhere(
  organizationId: string,
  query: ListQuery,
  overrides?: Prisma.TransactionWhereInput,
): Prisma.TransactionWhereInput {
  const term = query.q.trim();
  const { type, accountId, from, to } = query.filters;

  return {
    organizationId,
    deletedAt: null,
    ...(type ? { type: type as TransactionType } : {}),
    ...(accountId ? { OR: [{ accountId }, { toAccountId: accountId }] } : {}),
    ...(from || to
      ? {
          occurredAt: {
            ...(from ? { gte: new Date(from) } : {}),
            ...(to ? { lte: endOfDay(new Date(to)) } : {}),
          },
        }
      : {}),
    ...(term
      ? {
          OR: [
            { description: { contains: term, mode: 'insensitive' } },
            { reference: { contains: term, mode: 'insensitive' } },
            { category: { contains: term, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...overrides,
  };
}

function endOfDay(date: Date) {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

export type TransactionListRow = {
  id: string;
  type: string;
  amount: number;
  description: string;
  category: string | null;
  occurredAt: Date;
  reference: string | null;
  accountName: string;
  toAccountName: string | null;
  /** Set when the row came from an invoice, bill, payment or expense. */
  sourceLabel: string | null;
  sourceHref: string | null;
  /** True when nothing else owns this row, so it can be edited or removed. */
  isManual: boolean;
};

function sourceOf(row: {
  invoiceId: string | null;
  billId: string | null;
  expenseId: string | null;
  invoice: { number: string } | null;
  bill: { number: string } | null;
  expense: { number: string } | null;
}) {
  if (row.invoiceId && row.invoice) {
    return { label: row.invoice.number, href: `/invoices/${row.invoiceId}` };
  }
  if (row.billId && row.bill) {
    return { label: row.bill.number, href: `/bills/${row.billId}` };
  }
  if (row.expenseId && row.expense) {
    return { label: row.expense.number, href: `/expenses/${row.expenseId}` };
  }
  return null;
}

const DETAIL_SELECT = {
  id: true,
  type: true,
  amount: true,
  description: true,
  category: true,
  occurredAt: true,
  reference: true,
  invoiceId: true,
  billId: true,
  expenseId: true,
  paymentId: true,
  account: { select: { name: true } },
  toAccount: { select: { name: true } },
  invoice: { select: { number: true } },
  bill: { select: { number: true } },
  expense: { select: { number: true } },
} satisfies Prisma.TransactionSelect;

export async function listTransactions(
  organizationId: string,
  query: ListQuery,
  overrides?: Prisma.TransactionWhereInput,
) {
  const where = transactionWhere(organizationId, query, overrides);

  const [transactions, count, totals] = await Promise.all([
    db.transaction.findMany({
      where,
      orderBy: orderByFor(query, SORTABLE, { occurredAt: 'desc' }),
      ...paginationFor(query),
      select: DETAIL_SELECT,
    }),
    db.transaction.count({ where }),
    db.transaction.groupBy({
      by: ['type'],
      where,
      _sum: { amount: true },
    }),
  ]);

  const rows: TransactionListRow[] = transactions.map((row) => {
    const source = sourceOf(row);
    return {
      id: row.id,
      type: row.type,
      amount: toNumber(row.amount),
      description: row.description,
      category: row.category,
      occurredAt: row.occurredAt,
      reference: row.reference,
      accountName: row.account.name,
      toAccountName: row.toAccount?.name ?? null,
      sourceLabel: source?.label ?? null,
      sourceHref: source?.href ?? null,
      isManual: !row.invoiceId && !row.billId && !row.expenseId && !row.paymentId,
    };
  });

  const sumFor = (type: TransactionType) =>
    round(
      toNumber(totals.find((total) => total.type === type)?._sum.amount ?? 0),
    );

  const moneyIn = sumFor('INCOME');
  const moneyOut = sumFor('EXPENSE');

  return {
    rows,
    pageInfo: pageInfo(query, count),
    summary: {
      moneyIn,
      // Expenses are stored negative; report the magnitude.
      moneyOut: Math.abs(moneyOut),
      net: round(moneyIn + moneyOut),
    },
  };
}

export async function listTransactionsForExport(
  organizationId: string,
  query: ListQuery,
  overrides?: Prisma.TransactionWhereInput,
) {
  return db.transaction.findMany({
    where: transactionWhere(organizationId, query, overrides),
    orderBy: orderByFor(query, SORTABLE, { occurredAt: 'desc' }),
    select: DETAIL_SELECT,
    take: 5000,
  });
}

export async function getTransaction(organizationId: string, id: string) {
  return db.transaction.findFirst({
    where: { id, organizationId, deletedAt: null },
    select: DETAIL_SELECT,
  });
}

/** Money in and out for a period, plus the month before it, for the headers. */
export async function cashSummary(organizationId: string, now = new Date()) {
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const base = { organizationId, deletedAt: null };

  const [thisMonth, lastMonth, balances] = await Promise.all([
    db.transaction.groupBy({
      by: ['type'],
      where: { ...base, occurredAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    db.transaction.groupBy({
      by: ['type'],
      where: {
        ...base,
        occurredAt: { gte: startOfLastMonth, lt: startOfMonth },
      },
      _sum: { amount: true },
    }),
    db.account.aggregate({
      where: { organizationId, deletedAt: null, isActive: true },
      _sum: { currentBalance: true },
    }),
  ]);

  const pick = (
    rows: Array<{ type: TransactionType; _sum: { amount: unknown } }>,
    type: TransactionType,
  ) => round(toNumber(rows.find((row) => row.type === type)?._sum.amount ?? 0));

  const inNow = pick(thisMonth, 'INCOME');
  const outNow = Math.abs(pick(thisMonth, 'EXPENSE'));
  const inPrev = pick(lastMonth, 'INCOME');
  const outPrev = Math.abs(pick(lastMonth, 'EXPENSE'));

  return {
    moneyIn: inNow,
    moneyOut: outNow,
    net: round(inNow - outNow),
    previousNet: round(inPrev - outPrev),
    cashOnHand: round(toNumber(balances._sum?.currentBalance)),
  };
}

/**
 * Where income came from over a period, grouped by the category on the row.
 *
 * Rows written by a payment carry the category the payment flow set ("Sales"),
 * so takings recorded by hand and money collected against an invoice land in
 * the same picture rather than two separate ones.
 */
export async function incomeByCategory(
  organizationId: string,
  from: Date,
  to: Date,
) {
  const rows = await db.transaction.groupBy({
    by: ['category'],
    where: {
      organizationId,
      deletedAt: null,
      type: 'INCOME',
      occurredAt: { gte: from, lte: to },
    },
    _sum: { amount: true },
    _count: true,
    orderBy: { _sum: { amount: 'desc' } },
  });

  return rows.map((row) => ({
    category: row.category ?? 'Uncategorised',
    total: round(toNumber(row._sum.amount)),
    count: row._count,
  }));
}

export async function accountOptions(organizationId: string) {
  return db.account.findMany({
    where: { organizationId, deletedAt: null, isActive: true },
    orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
    select: { id: true, name: true, currentBalance: true },
    take: 200,
  });
}
