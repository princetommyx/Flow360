import 'server-only';

import {
  addDays,
  addMonths,
  addWeeks,
  differenceInCalendarDays,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

import { db } from '@/lib/db';
import { toNumber, round } from '@/lib/money';
import { percentChange } from '@/lib/utils';
import type { DateRange } from '@/lib/date';

/** Invoices in these states are not yet real revenue. */
const COUNTED_INVOICE_STATUSES = [
  'SENT',
  'VIEWED',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
] as const;

export type MetricValue = {
  value: number;
  previous: number;
  change: number | null;
};

export type DashboardSummary = {
  revenue: MetricValue;
  expenses: MetricValue;
  netProfit: MetricValue;
  collected: MetricValue;
  outstanding: number;
  overdueCount: number;
  customers: number;
  newCustomers: number;
  products: number;
  lowStockCount: number;
};

async function revenueBetween(organizationId: string, range: DateRange) {
  const result = await db.invoice.aggregate({
    where: {
      organizationId,
      deletedAt: null,
      status: { in: [...COUNTED_INVOICE_STATUSES] },
      issueDate: { gte: range.from, lte: range.to },
    },
    _sum: { total: true },
  });
  return toNumber(result._sum.total);
}

async function expensesBetween(organizationId: string, range: DateRange) {
  const result = await db.expense.aggregate({
    where: {
      organizationId,
      deletedAt: null,
      status: { not: 'REJECTED' },
      spentAt: { gte: range.from, lte: range.to },
    },
    _sum: { total: true },
  });
  return toNumber(result._sum.total);
}

async function collectedBetween(organizationId: string, range: DateRange) {
  const result = await db.payment.aggregate({
    where: {
      organizationId,
      deletedAt: null,
      direction: 'INCOMING',
      paidAt: { gte: range.from, lte: range.to },
    },
    _sum: { amount: true },
  });
  return toNumber(result._sum.amount);
}

const metric = (value: number, previous: number): MetricValue => ({
  value: round(value),
  previous: round(previous),
  change: percentChange(value, previous),
});

export async function getDashboardSummary(
  organizationId: string,
  range: DateRange,
  previous: DateRange,
): Promise<DashboardSummary> {
  const [
    revenue,
    previousRevenue,
    expenses,
    previousExpenses,
    collected,
    previousCollected,
    outstanding,
    overdueCount,
    customers,
    newCustomers,
    products,
    lowStock,
  ] = await Promise.all([
    revenueBetween(organizationId, range),
    revenueBetween(organizationId, previous),
    expensesBetween(organizationId, range),
    expensesBetween(organizationId, previous),
    collectedBetween(organizationId, range),
    collectedBetween(organizationId, previous),
    db.invoice.aggregate({
      where: {
        organizationId,
        deletedAt: null,
        status: { in: ['SENT', 'VIEWED', 'PARTIALLY_PAID', 'OVERDUE'] },
      },
      _sum: { balanceDue: true },
    }),
    db.invoice.count({
      where: {
        organizationId,
        deletedAt: null,
        status: { in: ['SENT', 'VIEWED', 'PARTIALLY_PAID', 'OVERDUE'] },
        dueDate: { lt: new Date() },
      },
    }),
    db.customer.count({ where: { organizationId, deletedAt: null, status: 'ACTIVE' } }),
    db.customer.count({
      where: {
        organizationId,
        deletedAt: null,
        createdAt: { gte: range.from, lte: range.to },
      },
    }),
    db.product.count({ where: { organizationId, deletedAt: null, status: 'ACTIVE' } }),
    countLowStock(organizationId),
  ]);

  return {
    revenue: metric(revenue, previousRevenue),
    expenses: metric(expenses, previousExpenses),
    netProfit: metric(revenue - expenses, previousRevenue - previousExpenses),
    collected: metric(collected, previousCollected),
    outstanding: round(toNumber(outstanding._sum.balanceDue)),
    overdueCount,
    customers,
    newCustomers,
    products,
    lowStockCount: lowStock,
  };
}

/** Prisma cannot compare two columns, so low stock is counted in SQL. */
async function countLowStock(organizationId: string) {
  const rows = await db.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM products
    WHERE "organizationId" = ${organizationId}
      AND "deletedAt" IS NULL
      AND "trackInventory" = true
      AND "status" = 'ACTIVE'
      AND "stockQuantity" <= "minStockLevel"
  `;
  return Number(rows[0]?.count ?? 0);
}

export type TrendPoint = {
  date: string;
  label: string;
  revenue: number;
  expenses: number;
  profit: number;
};

/** Chooses a bucket size that keeps the chart between roughly 7 and 31 points. */
function bucketFor(range: DateRange): 'day' | 'week' | 'month' {
  const days = differenceInCalendarDays(range.to, range.from);
  if (days <= 31) return 'day';
  if (days <= 120) return 'week';
  return 'month';
}

export async function getRevenueTrend(
  organizationId: string,
  range: DateRange,
  now: Date = new Date(),
): Promise<TrendPoint[]> {
  const bucket = bucketFor(range);
  // A period that has not finished yet would otherwise plot a long flat tail of
  // zeroes for days that simply have not happened.
  const to = range.to > now ? now : range.to;

  const [revenueRows, expenseRows] = await Promise.all([
    db.$queryRaw<Array<{ bucket: Date; total: string }>>`
      SELECT date_trunc(${bucket}, "issueDate") AS bucket, COALESCE(SUM("total"), 0)::text AS total
      FROM invoices
      WHERE "organizationId" = ${organizationId}
        AND "deletedAt" IS NULL
        AND "status" = ANY(${[...COUNTED_INVOICE_STATUSES]}::"InvoiceStatus"[])
        AND "issueDate" BETWEEN ${range.from} AND ${to}
      GROUP BY 1
      ORDER BY 1
    `,
    db.$queryRaw<Array<{ bucket: Date; total: string }>>`
      SELECT date_trunc(${bucket}, "spentAt") AS bucket, COALESCE(SUM("total"), 0)::text AS total
      FROM expenses
      WHERE "organizationId" = ${organizationId}
        AND "deletedAt" IS NULL
        AND "status" <> 'REJECTED'
        AND "spentAt" BETWEEN ${range.from} AND ${to}
      GROUP BY 1
      ORDER BY 1
    `,
  ]);

  const points = new Map<string, TrendPoint>();

  const keyFor = (date: Date) => date.toISOString().slice(0, 10);
  const labelFor = (date: Date) =>
    bucket === 'month'
      ? date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const upsert = (date: Date) => {
    const key = keyFor(date);
    if (!points.has(key)) {
      points.set(key, {
        date: key,
        label: labelFor(date),
        revenue: 0,
        expenses: 0,
        profit: 0,
      });
    }
    return points.get(key)!;
  };

  // Seed every bucket in the window first so a quiet day plots as zero rather
  // than collapsing the line into a handful of disconnected points.
  const startOfBucket =
    bucket === 'month'
      ? startOfMonth
      : bucket === 'week'
        ? (date: Date) => startOfWeek(date, { weekStartsOn: 1 })
        : startOfDay;
  const advance =
    bucket === 'month'
      ? (date: Date) => addMonths(date, 1)
      : bucket === 'week'
        ? (date: Date) => addWeeks(date, 1)
        : (date: Date) => addDays(date, 1);

  for (
    let cursor = startOfBucket(range.from);
    cursor <= to;
    cursor = advance(cursor)
  ) {
    upsert(cursor);
  }

  for (const row of revenueRows) upsert(row.bucket).revenue = round(Number(row.total));
  for (const row of expenseRows) upsert(row.bucket).expenses = round(Number(row.total));

  return [...points.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((point) => ({ ...point, profit: round(point.revenue - point.expenses) }));
}

export type StatusSlice = { status: string; count: number; amount: number };

export async function getInvoiceStatusBreakdown(
  organizationId: string,
  range: DateRange,
): Promise<StatusSlice[]> {
  const rows = await db.invoice.groupBy({
    by: ['status'],
    where: {
      organizationId,
      deletedAt: null,
      issueDate: { gte: range.from, lte: range.to },
    },
    _count: { _all: true },
    _sum: { total: true },
  });

  return rows
    .map((row) => ({
      status: row.status,
      count: row._count._all,
      amount: round(toNumber(row._sum.total)),
    }))
    .sort((a, b) => b.amount - a.amount);
}

export type TopProduct = {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  revenue: number;
};

export async function getTopProducts(
  organizationId: string,
  range: DateRange,
  limit = 5,
): Promise<TopProduct[]> {
  return db.$queryRaw<TopProduct[]>`
    SELECT p."id",
           p."name",
           p."sku",
           SUM(ii."quantity")::float8  AS quantity,
           SUM(ii."lineTotal")::float8 AS revenue
    FROM invoice_items ii
    JOIN invoices i ON i."id" = ii."invoiceId"
    JOIN products p ON p."id" = ii."productId"
    WHERE i."organizationId" = ${organizationId}
      AND i."deletedAt" IS NULL
      AND i."status" = ANY(${[...COUNTED_INVOICE_STATUSES]}::"InvoiceStatus"[])
      AND i."issueDate" BETWEEN ${range.from} AND ${range.to}
    GROUP BY p."id", p."name", p."sku"
    ORDER BY revenue DESC
    LIMIT ${limit}
  `;
}

export async function getLowStockProducts(organizationId: string, limit = 6) {
  return db.$queryRaw<
    Array<{
      id: string;
      name: string;
      sku: string;
      stockQuantity: number;
      minStockLevel: number;
      unit: string;
    }>
  >`
    SELECT "id", "name", "sku",
           "stockQuantity"::float8 AS "stockQuantity",
           "minStockLevel"::float8 AS "minStockLevel",
           "unit"
    FROM products
    WHERE "organizationId" = ${organizationId}
      AND "deletedAt" IS NULL
      AND "trackInventory" = true
      AND "status" = 'ACTIVE'
      AND "stockQuantity" <= "minStockLevel"
    ORDER BY ("stockQuantity" - "minStockLevel") ASC
    LIMIT ${limit}
  `;
}

export async function getRecentActivity(organizationId: string) {
  const [invoices, transactions, customers] = await Promise.all([
    db.invoice.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: {
        id: true,
        number: true,
        status: true,
        total: true,
        balanceDue: true,
        dueDate: true,
        issueDate: true,
        customer: { select: { id: true, name: true } },
      },
    }),
    db.transaction.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { occurredAt: 'desc' },
      take: 6,
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        occurredAt: true,
        account: { select: { name: true } },
      },
    }),
    db.customer.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        companyName: true,
        email: true,
        createdAt: true,
      },
    }),
  ]);

  return { invoices, transactions, customers };
}
