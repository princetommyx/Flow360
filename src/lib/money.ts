import { locale } from '@/lib/config/brand';

/**
 * Money helpers.
 *
 * Prisma returns `Decimal` for money columns. Everything crossing the
 * server/client boundary is converted to a plain `number` of major units
 * (dollars, not cents) via `toNumber`, and all arithmetic is rounded to two
 * decimals at each step so totals always reconcile with the stored values.
 */

type DecimalLike = { toString(): string };

export function toNumber(value: DecimalLike | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const parsed = Number(value.toString());
  return Number.isFinite(parsed) ? parsed : 0;
}

export function round(value: number, precision = 2): number {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function formatCurrency(
  value: DecimalLike | number | null | undefined,
  options: { currency?: string; compact?: boolean; signed?: boolean } = {},
): string {
  const amount = toNumber(value);
  const formatted = new Intl.NumberFormat(locale.locale, {
    style: 'currency',
    currency: options.currency ?? locale.currency,
    notation: options.compact ? 'compact' : 'standard',
    maximumFractionDigits: options.compact ? 1 : 2,
    minimumFractionDigits: options.compact ? 0 : 2,
  }).format(amount);

  return options.signed && amount > 0 ? `+${formatted}` : formatted;
}

export function formatNumber(
  value: DecimalLike | number | null | undefined,
  maximumFractionDigits = 2,
): string {
  return new Intl.NumberFormat(locale.locale, { maximumFractionDigits }).format(
    toNumber(value),
  );
}

/**
 * A change, signed. The leading plus is the point: it says "up on last time".
 */
export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `${value > 0 ? '+' : ''}${value.toFixed(digits)}%`;
}

/**
 * A proportion: a share of spend, a margin, a percentage of revenue.
 *
 * Unsigned, because a plus in front of one reads as growth that is not being
 * claimed. A negative margin keeps its minus, which is doing real work.
 */
export function formatRatio(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `${value.toFixed(digits)}%`;
}

export type LineInput = {
  quantity: number;
  unitPrice: number;
  /** Per-line discount, as a percentage of the line subtotal. */
  discountRate?: number;
  /** Per-line tax, as a percentage of the discounted line amount. */
  taxRate?: number;
};

export type LineTotals = {
  lineSubtotal: number;
  lineDiscount: number;
  lineTax: number;
  lineTotal: number;
};

/** Single source of truth for line-level maths — used by invoices, quotes, POs and bills. */
export function calculateLine(input: LineInput): LineTotals {
  const lineSubtotal = round(input.quantity * input.unitPrice);
  const lineDiscount = round((lineSubtotal * (input.discountRate ?? 0)) / 100);
  const taxable = round(lineSubtotal - lineDiscount);
  const lineTax = round((taxable * (input.taxRate ?? 0)) / 100);
  return {
    lineSubtotal,
    lineDiscount,
    lineTax,
    lineTotal: round(taxable + lineTax),
  };
}

export type DocumentTotalsInput = {
  lines: LineInput[];
  /** Document-level discount applied after line discounts. */
  discountType?: 'PERCENTAGE' | 'FIXED';
  discountValue?: number;
  shippingAmount?: number;
};

export type DocumentTotals = {
  subtotal: number;
  lineDiscountTotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  total: number;
  lines: LineTotals[];
};

/**
 * Document-level maths.
 *
 * Order of operations: line subtotal -> line discount -> document discount
 * (spread proportionally across lines) -> tax -> shipping. Spreading the
 * document discount before tax keeps the tax base correct for every line.
 */
export function calculateDocumentTotals(
  input: DocumentTotalsInput,
): DocumentTotals {
  const lines = input.lines.map(calculateLine);

  const subtotal = round(lines.reduce((t, l) => t + l.lineSubtotal, 0));
  const lineDiscountTotal = round(lines.reduce((t, l) => t + l.lineDiscount, 0));
  const afterLineDiscount = round(subtotal - lineDiscountTotal);

  const discountAmount =
    input.discountType === 'FIXED'
      ? Math.min(round(input.discountValue ?? 0), afterLineDiscount)
      : round((afterLineDiscount * (input.discountValue ?? 0)) / 100);

  const discountRatio =
    afterLineDiscount > 0 ? discountAmount / afterLineDiscount : 0;

  const taxAmount = round(
    lines.reduce((total, line, index) => {
      const taxRate = input.lines[index]?.taxRate ?? 0;
      const base = round((line.lineSubtotal - line.lineDiscount) * (1 - discountRatio));
      return total + (base * taxRate) / 100;
    }, 0),
  );

  const shippingAmount = round(input.shippingAmount ?? 0);

  return {
    subtotal,
    lineDiscountTotal,
    discountAmount,
    taxAmount,
    shippingAmount,
    total: round(afterLineDiscount - discountAmount + taxAmount + shippingAmount),
    lines,
  };
}

export type PayslipInput = {
  baseSalary: number;
  allowances?: number;
  overtime?: number;
  bonus?: number;
  taxDeduction?: number;
  otherDeduction?: number;
};

export type PayslipTotals = {
  gross: number;
  deductions: number;
  net: number;
};

/**
 * Payslip arithmetic.
 *
 * Here rather than in the payroll service for the same reason document totals
 * are here: the figure on the screen, the figure in the database and the
 * figure on the payslip must come from one implementation. Net is always
 * derived — never typed — so a payslip cannot disagree with its own sums.
 */
export function calculatePayslip(input: PayslipInput): PayslipTotals {
  const gross = round(
    input.baseSalary +
      (input.allowances ?? 0) +
      (input.overtime ?? 0) +
      (input.bonus ?? 0),
  );
  const deductions = round((input.taxDeduction ?? 0) + (input.otherDeduction ?? 0));

  return { gross, deductions, net: round(gross - deductions) };
}
