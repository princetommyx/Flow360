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
import { round, toNumber } from '@/lib/money';
import { percentChange } from '@/lib/utils';
import type { DateRange } from '@/lib/date';

/**
 * Reads behind the four reports.
 *
 * Every figure is recomputed from the rows it describes rather than read from
 * a stored total, and every query is scoped to the organization. Nothing here
 * writes, so a report can be opened by anyone whose role grants
 * `reports.view` without any risk of it changing the books it is describing.
 */

/** Invoices in these states are real revenue. A draft or a void is not. */
const COUNTED_INVOICE_STATUSES = [
  'SENT',
  'VIEWED',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
] as const;

/** A bill counts as a cost once it is awaiting payment. A draft is not. */
const COUNTED_BILL_STATUSES = [
  'AWAITING_PAYMENT',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
] as const;

/** Bills still owed, whatever their age. */
const OPEN_BILL_STATUSES = ['AWAITING_PAYMENT', 'PARTIALLY_PAID', 'OVERDUE'] as const;

export type Comparison = { value: number; previous: number; change: number | null };

function compare(value: number, previous: number): Comparison {
  return { value: round(value), previous: round(previous), change: percentChange(value, previous) };
}

/* ── Bucketing ────────────────────────────────────────────────────────────── */

type Bucket = 'day' | 'week' | 'month';

/** Keeps a chart between roughly 7 and 31 points whatever period is chosen. */
function bucketFor(range: DateRange): Bucket {
  const days = differenceInCalendarDays(range.to, range.from);
  if (days <= 31) return 'day';
  if (days <= 120) return 'week';
  return 'month';
}

export type SeriesPoint = { date: string; label: string; values: Record<string, number> };

/**
 * Turns dated rows into an evenly spaced series.
 *
 * Every bucket in the window is seeded first, so a quiet week plots as zero
 * rather than vanishing and pulling the line across a gap that never happened.
 */
function buildSeries(
  range: DateRange,
  keys: string[],
  rows: Array<{ at: Date; key: string; amount: number }>,
  now = new Date(),
): SeriesPoint[] {
  const bucket = bucketFor(range);
  const to = range.to > now ? now : range.to;

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

  const labelFor = (date: Date) =>
    bucket === 'month'
      ? date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
      : date.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });

  const points = new Map<string, SeriesPoint>();
  const upsert = (date: Date) => {
    const start = startOfBucket(date);
    const id = start.toISOString().slice(0, 10);
    if (!points.has(id)) {
      points.set(id, {
        date: id,
        label: labelFor(start),
        values: Object.fromEntries(keys.map((key) => [key, 0])),
      });
    }
    return points.get(id)!;
  };

  for (let cursor = startOfBucket(range.from); cursor <= to; cursor = advance(cursor)) {
    upsert(cursor);
  }

  for (const row of rows) {
    const point = upsert(row.at);
    point.values[row.key] = round((point.values[row.key] ?? 0) + row.amount);
  }

  return [...points.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/* ── Sales ────────────────────────────────────────────────────────────────── */

export type SalesSummary = {
  invoiced: Comparison;
  collected: Comparison;
  invoiceCount: Comparison;
  averageInvoice: Comparison;
  outstanding: number;
  overdue: number;
};

async function invoicedIn(organizationId: string, range: DateRange) {
  const result = await db.invoice.aggregate({
    where: {
      organizationId,
      deletedAt: null,
      status: { in: [...COUNTED_INVOICE_STATUSES] },
      issueDate: { gte: range.from, lte: range.to },
    },
    _sum: { total: true },
    _count: { _all: true },
  });
  return { total: toNumber(result._sum.total), count: result._count._all };
}

async function collectedIn(organizationId: string, range: DateRange) {
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

export async function getSalesSummary(
  organizationId: string,
  range: DateRange,
  previous: DateRange,
): Promise<SalesSummary> {
  const [now, before, collectedNow, collectedBefore, open] = await Promise.all([
    invoicedIn(organizationId, range),
    invoicedIn(organizationId, previous),
    collectedIn(organizationId, range),
    collectedIn(organizationId, previous),
    db.invoice.aggregate({
      where: {
        organizationId,
        deletedAt: null,
        status: { in: ['SENT', 'VIEWED', 'PARTIALLY_PAID', 'OVERDUE'] },
      },
      _sum: { balanceDue: true },
    }),
  ]);

  const overdue = await db.invoice.aggregate({
    where: { organizationId, deletedAt: null, status: 'OVERDUE' },
    _sum: { balanceDue: true },
  });

  return {
    invoiced: compare(now.total, before.total),
    collected: compare(collectedNow, collectedBefore),
    invoiceCount: compare(now.count, before.count),
    averageInvoice: compare(
      now.count > 0 ? now.total / now.count : 0,
      before.count > 0 ? before.total / before.count : 0,
    ),
    outstanding: round(toNumber(open._sum.balanceDue)),
    overdue: round(toNumber(overdue._sum.balanceDue)),
  };
}

export async function getSalesTrend(organizationId: string, range: DateRange) {
  const [invoices, payments] = await Promise.all([
    db.invoice.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: { in: [...COUNTED_INVOICE_STATUSES] },
        issueDate: { gte: range.from, lte: range.to },
      },
      select: { issueDate: true, total: true },
    }),
    db.payment.findMany({
      where: {
        organizationId,
        deletedAt: null,
        direction: 'INCOMING',
        paidAt: { gte: range.from, lte: range.to },
      },
      select: { paidAt: true, amount: true },
    }),
  ]);

  return buildSeries(range, ['invoiced', 'collected'], [
    ...invoices.map((row) => ({ at: row.issueDate, key: 'invoiced', amount: toNumber(row.total) })),
    ...payments.map((row) => ({ at: row.paidAt, key: 'collected', amount: toNumber(row.amount) })),
  ]);
}

export type CustomerSales = {
  id: string;
  name: string;
  invoices: number;
  invoiced: number;
  outstanding: number;
};

export async function getSalesByCustomer(
  organizationId: string,
  range: DateRange,
  limit = 10,
): Promise<CustomerSales[]> {
  const grouped = await db.invoice.groupBy({
    by: ['customerId'],
    where: {
      organizationId,
      deletedAt: null,
      status: { in: [...COUNTED_INVOICE_STATUSES] },
      issueDate: { gte: range.from, lte: range.to },
    },
    _sum: { total: true, balanceDue: true },
    _count: { _all: true },
  });

  const customers = await db.customer.findMany({
    where: { organizationId, id: { in: grouped.map((row) => row.customerId) } },
    select: { id: true, name: true, companyName: true },
  });
  const nameById = new Map(customers.map((c) => [c.id, c.companyName ?? c.name]));

  return grouped
    .map((row) => ({
      id: row.customerId,
      name: nameById.get(row.customerId) ?? 'Removed customer',
      invoices: row._count._all,
      invoiced: round(toNumber(row._sum.total)),
      outstanding: round(toNumber(row._sum.balanceDue)),
    }))
    .sort((a, b) => b.invoiced - a.invoiced)
    .slice(0, limit);
}

export type ProductSales = { name: string; sku: string | null; quantity: number; revenue: number };

export async function getSalesByProduct(
  organizationId: string,
  range: DateRange,
  limit = 10,
): Promise<ProductSales[]> {
  const items = await db.invoiceItem.findMany({
    where: {
      invoice: {
        organizationId,
        deletedAt: null,
        status: { in: [...COUNTED_INVOICE_STATUSES] },
        issueDate: { gte: range.from, lte: range.to },
      },
    },
    select: {
      name: true,
      quantity: true,
      lineTotal: true,
      product: { select: { id: true, name: true, sku: true } },
    },
  });

  const byKey = new Map<string, ProductSales>();
  for (const item of items) {
    // Lines typed by hand have no product, so they group under their own text.
    const key = item.product?.id ?? `free:${item.name}`;
    const current = byKey.get(key) ?? {
      name: item.product?.name ?? item.name,
      sku: item.product?.sku ?? null,
      quantity: 0,
      revenue: 0,
    };
    current.quantity = round(current.quantity + toNumber(item.quantity), 3);
    current.revenue = round(current.revenue + toNumber(item.lineTotal));
    byKey.set(key, current);
  }

  return [...byKey.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

/* ── Expenses ─────────────────────────────────────────────────────────────── */

export type ExpenseSummary = {
  spent: Comparison;
  billed: Comparison;
  count: Comparison;
  averageExpense: Comparison;
  unpaidBills: number;
};

async function spentIn(organizationId: string, range: DateRange) {
  const result = await db.expense.aggregate({
    where: {
      organizationId,
      deletedAt: null,
      status: { not: 'REJECTED' },
      spentAt: { gte: range.from, lte: range.to },
    },
    _sum: { total: true },
    _count: { _all: true },
  });
  return { total: toNumber(result._sum.total), count: result._count._all };
}

async function billedIn(organizationId: string, range: DateRange) {
  const result = await db.bill.aggregate({
    where: {
      organizationId,
      deletedAt: null,
      status: { in: [...COUNTED_BILL_STATUSES] },
      issueDate: { gte: range.from, lte: range.to },
    },
    _sum: { total: true },
  });
  return toNumber(result._sum.total);
}

export async function getExpenseSummary(
  organizationId: string,
  range: DateRange,
  previous: DateRange,
): Promise<ExpenseSummary> {
  const [now, before, billsNow, billsBefore, unpaid] = await Promise.all([
    spentIn(organizationId, range),
    spentIn(organizationId, previous),
    billedIn(organizationId, range),
    billedIn(organizationId, previous),
    db.bill.aggregate({
      where: {
        organizationId,
        deletedAt: null,
        status: { in: [...OPEN_BILL_STATUSES] },
      },
      _sum: { balanceDue: true },
    }),
  ]);

  return {
    spent: compare(now.total, before.total),
    billed: compare(billsNow, billsBefore),
    count: compare(now.count, before.count),
    averageExpense: compare(
      now.count > 0 ? now.total / now.count : 0,
      before.count > 0 ? before.total / before.count : 0,
    ),
    unpaidBills: round(toNumber(unpaid._sum.balanceDue)),
  };
}

export type CategorySpend = {
  id: string | null;
  name: string;
  color: string | null;
  total: number;
  count: number;
  share: number;
};

export async function getExpensesByCategory(
  organizationId: string,
  range: DateRange,
): Promise<CategorySpend[]> {
  const grouped = await db.expense.groupBy({
    by: ['categoryId'],
    where: {
      organizationId,
      deletedAt: null,
      status: { not: 'REJECTED' },
      spentAt: { gte: range.from, lte: range.to },
    },
    _sum: { total: true },
    _count: { _all: true },
  });

  const categories = await db.expenseCategory.findMany({
    where: {
      organizationId,
      id: { in: grouped.map((row) => row.categoryId).filter((id): id is string => Boolean(id)) },
    },
    select: { id: true, name: true, color: true },
  });
  const byId = new Map(categories.map((row) => [row.id, row]));

  const total = grouped.reduce((sum, row) => sum + toNumber(row._sum.total), 0);

  return grouped
    .map((row) => {
      const amount = toNumber(row._sum.total);
      const category = row.categoryId ? byId.get(row.categoryId) : undefined;
      return {
        id: row.categoryId,
        name: category?.name ?? 'Uncategorised',
        color: category?.color ?? null,
        total: round(amount),
        count: row._count._all,
        share: total > 0 ? round((amount / total) * 100, 1) : 0,
      };
    })
    .sort((a, b) => b.total - a.total);
}

export type SupplierSpend = { id: string; name: string; total: number; count: number };

export async function getExpensesBySupplier(
  organizationId: string,
  range: DateRange,
  limit = 10,
): Promise<SupplierSpend[]> {
  const [expenses, bills] = await Promise.all([
    db.expense.groupBy({
      by: ['supplierId'],
      where: {
        organizationId,
        deletedAt: null,
        status: { not: 'REJECTED' },
        supplierId: { not: null },
        spentAt: { gte: range.from, lte: range.to },
      },
      _sum: { total: true },
      _count: { _all: true },
    }),
    db.bill.groupBy({
      by: ['supplierId'],
      where: {
        organizationId,
        deletedAt: null,
        status: { in: [...COUNTED_BILL_STATUSES] },
        issueDate: { gte: range.from, lte: range.to },
      },
      _sum: { total: true },
      _count: { _all: true },
    }),
  ]);

  const ids = [
    ...expenses.map((row) => row.supplierId).filter((id): id is string => Boolean(id)),
    ...bills.map((row) => row.supplierId),
  ];

  const suppliers = await db.supplier.findMany({
    where: { organizationId, id: { in: ids } },
    select: { id: true, name: true, companyName: true },
  });
  const nameById = new Map(suppliers.map((s) => [s.id, s.companyName ?? s.name]));

  const totals = new Map<string, SupplierSpend>();
  const add = (id: string, amount: number, count: number) => {
    const current = totals.get(id) ?? {
      id,
      name: nameById.get(id) ?? 'Removed supplier',
      total: 0,
      count: 0,
    };
    current.total = round(current.total + amount);
    current.count += count;
    totals.set(id, current);
  };

  for (const row of expenses) {
    if (row.supplierId) add(row.supplierId, toNumber(row._sum.total), row._count._all);
  }
  for (const row of bills) {
    add(row.supplierId, toNumber(row._sum.total), row._count._all);
  }

  return [...totals.values()].sort((a, b) => b.total - a.total).slice(0, limit);
}

export async function getExpenseTrend(organizationId: string, range: DateRange) {
  const [expenses, bills] = await Promise.all([
    db.expense.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: { not: 'REJECTED' },
        spentAt: { gte: range.from, lte: range.to },
      },
      select: { spentAt: true, total: true },
    }),
    db.bill.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: { in: [...COUNTED_BILL_STATUSES] },
        issueDate: { gte: range.from, lte: range.to },
      },
      select: { issueDate: true, total: true },
    }),
  ]);

  return buildSeries(range, ['expenses', 'bills'], [
    ...expenses.map((row) => ({ at: row.spentAt, key: 'expenses', amount: toNumber(row.total) })),
    ...bills.map((row) => ({ at: row.issueDate, key: 'bills', amount: toNumber(row.total) })),
  ]);
}

/* ── Financial ────────────────────────────────────────────────────────────── */

export type ProfitAndLoss = {
  revenue: number;
  purchases: number;
  grossProfit: number;
  grossMargin: number;
  operatingExpenses: CategorySpend[];
  operatingTotal: number;
  payroll: number;
  netProfit: number;
  netMargin: number;
};

/**
 * Profit and loss for the period.
 *
 * Revenue is what was invoiced, not what was collected: a report that moved
 * with payments would credit January's work to March. Purchases are bills
 * received, payroll is payslips paid, and everything else is an operating
 * expense grouped by its category.
 */
export async function getProfitAndLoss(
  organizationId: string,
  range: DateRange,
): Promise<ProfitAndLoss> {
  const [revenue, purchases, operating, payslips] = await Promise.all([
    invoicedIn(organizationId, range),
    billedIn(organizationId, range),
    getExpensesByCategory(organizationId, range),
    db.payroll.aggregate({
      where: {
        organizationId,
        deletedAt: null,
        status: { in: ['APPROVED', 'PAID'] },
        periodEnd: { gte: range.from, lte: range.to },
      },
      _sum: { netSalary: true },
    }),
  ]);

  const operatingTotal = operating.reduce((sum, row) => sum + row.total, 0);
  const payroll = toNumber(payslips._sum.netSalary);
  const grossProfit = revenue.total - purchases;
  const netProfit = grossProfit - operatingTotal - payroll;

  return {
    revenue: round(revenue.total),
    purchases: round(purchases),
    grossProfit: round(grossProfit),
    grossMargin: revenue.total > 0 ? round((grossProfit / revenue.total) * 100, 1) : 0,
    operatingExpenses: operating,
    operatingTotal: round(operatingTotal),
    payroll: round(payroll),
    netProfit: round(netProfit),
    netMargin: revenue.total > 0 ? round((netProfit / revenue.total) * 100, 1) : 0,
  };
}

export type AccountBalance = {
  id: string;
  name: string;
  type: string;
  currency: string;
  balance: number;
};

export async function getCashPosition(organizationId: string): Promise<AccountBalance[]> {
  const accounts = await db.account.findMany({
    where: { organizationId, deletedAt: null, isActive: true },
    orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
    select: { id: true, name: true, type: true, currency: true, currentBalance: true },
  });

  return accounts.map((row) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    currency: row.currency,
    balance: round(toNumber(row.currentBalance)),
  }));
}

export type CashFlow = { inflow: number; outflow: number; net: number; series: SeriesPoint[] };

/**
 * Money actually moving, from the transaction ledger.
 *
 * Expenses are stored negative against the account they left, so the outflow
 * is the absolute value of the negative side. Transfers appear on both sides
 * of the same workspace and would double the totals, so they are excluded.
 */
export async function getCashFlow(
  organizationId: string,
  range: DateRange,
): Promise<CashFlow> {
  const rows = await db.transaction.findMany({
    where: {
      organizationId,
      deletedAt: null,
      type: { not: 'TRANSFER' },
      occurredAt: { gte: range.from, lte: range.to },
    },
    select: { occurredAt: true, amount: true },
  });

  let inflow = 0;
  let outflow = 0;
  const points: Array<{ at: Date; key: string; amount: number }> = [];

  for (const row of rows) {
    const amount = toNumber(row.amount);
    if (amount >= 0) {
      inflow += amount;
      points.push({ at: row.occurredAt, key: 'in', amount });
    } else {
      outflow += Math.abs(amount);
      points.push({ at: row.occurredAt, key: 'out', amount: Math.abs(amount) });
    }
  }

  return {
    inflow: round(inflow),
    outflow: round(outflow),
    net: round(inflow - outflow),
    series: buildSeries(range, ['in', 'out'], points),
  };
}

/* ── Inventory ────────────────────────────────────────────────────────────── */

export type InventorySummary = {
  trackedItems: number;
  unitsOnHand: number;
  costValue: number;
  retailValue: number;
  potentialMargin: number;
  lowStock: number;
  outOfStock: number;
};

export async function getInventorySummary(
  organizationId: string,
): Promise<InventorySummary> {
  const products = await db.product.findMany({
    where: {
      organizationId,
      deletedAt: null,
      trackInventory: true,
      status: 'ACTIVE',
    },
    select: {
      stockQuantity: true,
      minStockLevel: true,
      purchasePrice: true,
      sellingPrice: true,
    },
  });

  let unitsOnHand = 0;
  let costValue = 0;
  let retailValue = 0;
  let lowStock = 0;
  let outOfStock = 0;

  for (const product of products) {
    const quantity = toNumber(product.stockQuantity);
    unitsOnHand += quantity;
    costValue += quantity * toNumber(product.purchasePrice);
    retailValue += quantity * toNumber(product.sellingPrice);
    if (quantity <= 0) outOfStock += 1;
    else if (quantity <= toNumber(product.minStockLevel)) lowStock += 1;
  }

  return {
    trackedItems: products.length,
    unitsOnHand: round(unitsOnHand, 3),
    costValue: round(costValue),
    retailValue: round(retailValue),
    potentialMargin: round(retailValue - costValue),
    lowStock,
    outOfStock,
  };
}

export type CategoryStock = {
  id: string | null;
  name: string;
  items: number;
  units: number;
  costValue: number;
};

export async function getStockByCategory(organizationId: string): Promise<CategoryStock[]> {
  const products = await db.product.findMany({
    where: { organizationId, deletedAt: null, trackInventory: true, status: 'ACTIVE' },
    select: {
      stockQuantity: true,
      purchasePrice: true,
      category: { select: { id: true, name: true } },
    },
  });

  const byId = new Map<string, CategoryStock>();
  for (const product of products) {
    const key = product.category?.id ?? 'none';
    const current = byId.get(key) ?? {
      id: product.category?.id ?? null,
      name: product.category?.name ?? 'Uncategorised',
      items: 0,
      units: 0,
      costValue: 0,
    };
    const quantity = toNumber(product.stockQuantity);
    current.items += 1;
    current.units = round(current.units + quantity, 3);
    current.costValue = round(current.costValue + quantity * toNumber(product.purchasePrice));
    byId.set(key, current);
  }

  return [...byId.values()].sort((a, b) => b.costValue - a.costValue);
}

export type StockMovementSummary = {
  received: number;
  sold: number;
  adjusted: number;
  returned: number;
  movers: Array<{ id: string; name: string; sku: string; inQty: number; outQty: number }>;
};

export async function getStockMovements(
  organizationId: string,
  range: DateRange,
  limit = 10,
): Promise<StockMovementSummary> {
  const rows = await db.inventoryTransaction.findMany({
    where: { organizationId, occurredAt: { gte: range.from, lte: range.to } },
    select: {
      type: true,
      quantity: true,
      product: { select: { id: true, name: true, sku: true } },
    },
  });

  let received = 0;
  let sold = 0;
  let adjusted = 0;
  let returned = 0;

  const movers = new Map<string, { id: string; name: string; sku: string; inQty: number; outQty: number }>();

  for (const row of rows) {
    const quantity = toNumber(row.quantity);
    // Receipts and sales are the two movements a reader thinks in; everything
    // else is a correction, and returns are counted separately because they
    // undo a sale rather than being one.
    if (row.type === 'PURCHASE' || row.type === 'STOCK_IN') received += quantity;
    else if (row.type === 'SALE' || row.type === 'STOCK_OUT') sold += Math.abs(quantity);
    else if (row.type === 'RETURN_IN' || row.type === 'RETURN_OUT') returned += quantity;
    else adjusted += quantity;

    const current = movers.get(row.product.id) ?? {
      id: row.product.id,
      name: row.product.name,
      sku: row.product.sku,
      inQty: 0,
      outQty: 0,
    };
    if (quantity >= 0) current.inQty = round(current.inQty + quantity, 3);
    else current.outQty = round(current.outQty + Math.abs(quantity), 3);
    movers.set(row.product.id, current);
  }

  return {
    received: round(received, 3),
    sold: round(sold, 3),
    adjusted: round(adjusted, 3),
    returned: round(returned, 3),
    movers: [...movers.values()]
      .sort((a, b) => b.outQty + b.inQty - (a.outQty + a.inQty))
      .slice(0, limit),
  };
}

export type StockAlert = {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  minimum: number;
  unit: string;
  costValue: number;
};

export async function getStockAlerts(
  organizationId: string,
  limit = 12,
): Promise<StockAlert[]> {
  const products = await db.product.findMany({
    where: { organizationId, deletedAt: null, trackInventory: true, status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      sku: true,
      unit: true,
      stockQuantity: true,
      minStockLevel: true,
      purchasePrice: true,
    },
  });

  return products
    .map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      unit: product.unit,
      quantity: toNumber(product.stockQuantity),
      minimum: toNumber(product.minStockLevel),
      costValue: round(toNumber(product.stockQuantity) * toNumber(product.purchasePrice)),
    }))
    .filter((product) => product.quantity <= product.minimum)
    .sort((a, b) => a.quantity - a.minimum - (b.quantity - b.minimum))
    .slice(0, limit);
}
