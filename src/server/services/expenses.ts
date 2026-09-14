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
import type { ExpenseStatus, PaymentMethod } from '@/generated/prisma/enums';

const SORTABLE: Record<string, Prisma.ExpenseOrderByWithRelationInput> = {
  number: { number: 'asc' },
  spentAt: { spentAt: 'desc' },
  total: { total: 'desc' },
  title: { title: 'asc' },
  status: { status: 'asc' },
};

/** Statuses that count as real money out, for totals and the dashboard. */
export const COUNTED_STATUSES: ExpenseStatus[] = ['APPROVED', 'REIMBURSED'];

export function expenseWhere(
  organizationId: string,
  query: ListQuery,
): Prisma.ExpenseWhereInput {
  const term = query.q.trim();
  const { status, categoryId, method, supplierId } = query.filters;

  return {
    organizationId,
    deletedAt: null,
    ...(status ? { status: status as ExpenseStatus } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(supplierId ? { supplierId } : {}),
    ...(method ? { method: method as PaymentMethod } : {}),
    ...(term
      ? {
          OR: [
            { number: { contains: term, mode: 'insensitive' } },
            { title: { contains: term, mode: 'insensitive' } },
            { vendorName: { contains: term, mode: 'insensitive' } },
            { reference: { contains: term, mode: 'insensitive' } },
            { supplier: { name: { contains: term, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };
}

export type ExpenseListRow = {
  id: string;
  number: string;
  title: string;
  status: string;
  method: string;
  spentAt: Date;
  total: number;
  categoryName: string | null;
  payee: string | null;
  accountName: string | null;
  billable: boolean;
};

export async function listExpenses(organizationId: string, query: ListQuery) {
  const where = expenseWhere(organizationId, query);

  const [expenses, count, totals] = await Promise.all([
    db.expense.findMany({
      where,
      orderBy: orderByFor(query, SORTABLE, { spentAt: 'desc' }),
      ...paginationFor(query),
      select: {
        id: true,
        number: true,
        title: true,
        status: true,
        method: true,
        spentAt: true,
        total: true,
        billable: true,
        vendorName: true,
        category: { select: { name: true } },
        supplier: { select: { name: true, companyName: true } },
        account: { select: { name: true } },
      },
    }),
    db.expense.count({ where }),
    db.expense.aggregate({ where, _sum: { total: true } }),
  ]);

  const rows: ExpenseListRow[] = expenses.map((expense) => ({
    id: expense.id,
    number: expense.number,
    title: expense.title,
    status: expense.status,
    method: expense.method,
    spentAt: expense.spentAt,
    total: toNumber(expense.total),
    categoryName: expense.category?.name ?? null,
    payee:
      expense.supplier?.companyName ??
      expense.supplier?.name ??
      expense.vendorName ??
      null,
    accountName: expense.account?.name ?? null,
    billable: expense.billable,
  }));

  return {
    rows,
    pageInfo: pageInfo(query, count),
    summary: { spent: round(toNumber(totals._sum?.total)) },
  };
}

export async function listExpensesForExport(
  organizationId: string,
  query: ListQuery,
) {
  return db.expense.findMany({
    where: expenseWhere(organizationId, query),
    orderBy: orderByFor(query, SORTABLE, { spentAt: 'desc' }),
    include: {
      category: { select: { name: true } },
      supplier: { select: { name: true, companyName: true } },
      account: { select: { name: true } },
    },
    take: 5000,
  });
}

export async function getExpense(organizationId: string, id: string) {
  return db.expense.findFirst({
    where: { id, organizationId, deletedAt: null },
    include: {
      category: { select: { id: true, name: true } },
      supplier: { select: { id: true, name: true, companyName: true } },
      account: { select: { id: true, name: true } },
    },
  });
}

/** Spend this month and last, and the biggest category, for the page header. */
export async function expenseTotals(organizationId: string, now = new Date()) {
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const counted = {
    organizationId,
    deletedAt: null,
    status: { in: COUNTED_STATUSES },
  };

  const [thisMonth, lastMonth, byCategory] = await Promise.all([
    db.expense.aggregate({
      where: { ...counted, spentAt: { gte: startOfMonth } },
      _sum: { total: true },
    }),
    db.expense.aggregate({
      where: { ...counted, spentAt: { gte: startOfLastMonth, lt: startOfMonth } },
      _sum: { total: true },
    }),
    db.expense.groupBy({
      by: ['categoryId'],
      where: { ...counted, spentAt: { gte: startOfMonth } },
      _sum: { total: true },
      orderBy: { _sum: { total: 'desc' } },
      take: 1,
    }),
  ]);

  let topCategory: { name: string; total: number } | null = null;
  const top = byCategory[0];
  if (top?.categoryId) {
    const category = await db.expenseCategory.findFirst({
      where: { id: top.categoryId, organizationId },
      select: { name: true },
    });
    if (category) {
      topCategory = { name: category.name, total: round(toNumber(top._sum.total)) };
    }
  }

  return {
    thisMonth: round(toNumber(thisMonth._sum?.total)),
    lastMonth: round(toNumber(lastMonth._sum?.total)),
    topCategory,
  };
}

export async function expenseCategoryOptions(organizationId: string) {
  return db.expenseCategory.findMany({
    where: { organizationId, deletedAt: null },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
    take: 500,
  });
}
