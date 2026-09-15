import { csvResponse, exportFilename, toCsv } from '@/lib/csv';
import { parsePreset, previousDateRange, resolveDateRange } from '@/lib/date';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import {
  getExpenseSummary,
  getExpensesByCategory,
  getExpensesBySupplier,
} from '@/server/services/reports';

type Unit = 'money' | 'count' | 'units' | 'percent' | 'date';

/**
 * One cell of the report, with what its number is measured in.
 *
 * A single `Currency` column stamped on every row reads as if a count of
 * invoices were an amount of money, which is exactly the kind of thing a
 * spreadsheet will happily total for you.
 */
type Row = { section: string; label: string; detail: string; value: number | string; unit: Unit };

export async function GET(request: Request) {
  try {
    const context = await requirePermission(['reports.view', 'reports.export']);
    const organizationId = context.organization.id;

    const url = new URL(request.url);
    const preset = parsePreset(url.searchParams.get('period'));
    const range = resolveDateRange(preset, {
      from: url.searchParams.get('from') ?? undefined,
      to: url.searchParams.get('to') ?? undefined,
    });
    const previous = previousDateRange(preset, range);

    const [summary, categories, suppliers] = await Promise.all([
      getExpenseSummary(organizationId, range, previous),
      getExpensesByCategory(organizationId, range),
      getExpensesBySupplier(organizationId, range, 500),
    ]);

    const rows: Row[] = [
      { section: 'Period', label: 'From', detail: '', value: range.from.toISOString().slice(0, 10), unit: 'date' },
      { section: 'Period', label: 'To', detail: '', value: range.to.toISOString().slice(0, 10), unit: 'date' },
      { section: 'Summary', label: 'Spent', detail: '', value: summary.spent.value, unit: 'money' },
      { section: 'Summary', label: 'Billed by suppliers', detail: '', value: summary.billed.value, unit: 'money' },
      { section: 'Summary', label: 'Expenses recorded', detail: '', value: summary.count.value, unit: 'count' },
      { section: 'Summary', label: 'Average expense', detail: '', value: summary.averageExpense.value, unit: 'money' },
      { section: 'Summary', label: 'Bills still owed', detail: '', value: summary.unpaidBills, unit: 'money' },
      ...categories.flatMap((row): Row[] => [
        { section: 'Category', label: row.name, detail: 'Total', value: row.total, unit: 'money' },
        { section: 'Category', label: row.name, detail: 'Share of spend', value: row.share, unit: 'percent' },
        { section: 'Category', label: row.name, detail: 'Count', value: row.count, unit: 'count' },
      ]),
      ...suppliers.flatMap((row): Row[] => [
        { section: 'Supplier', label: row.name, detail: 'Total', value: row.total, unit: 'money' },
        { section: 'Supplier', label: row.name, detail: 'Documents', value: row.count, unit: 'count' },
      ]),
    ];

    const csv = toCsv(rows, [
      { header: 'Section', value: (row) => row.section },
      { header: 'Name', value: (row) => row.label },
      { header: 'Detail', value: (row) => row.detail },
      { header: 'Value', value: (row) => row.value },
      {
        header: 'Unit',
        value: (row) =>
          row.unit === 'money'
            ? context.organization.currency
            : row.unit === 'percent'
              ? '%'
              : row.unit,
      },
    ]);

    return csvResponse(csv, exportFilename('expense-report'));
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return new Response('Forbidden', { status: 403 });
    }
    throw error;
  }
}
