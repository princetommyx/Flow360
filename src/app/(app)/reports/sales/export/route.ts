import { csvResponse, exportFilename, toCsv } from '@/lib/csv';
import { parsePreset, previousDateRange, resolveDateRange } from '@/lib/date';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import {
  getSalesByCustomer,
  getSalesByProduct,
  getSalesSummary,
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

/**
 * The sales report as a single sheet.
 *
 * One flat table with a section column rather than four files: the figures are
 * read together, and a spreadsheet filters a column far more easily than it
 * joins four downloads.
 */
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

    const [summary, customers, products] = await Promise.all([
      getSalesSummary(organizationId, range, previous),
      getSalesByCustomer(organizationId, range, 500),
      getSalesByProduct(organizationId, range, 500),
    ]);

    const rows: Row[] = [
      { section: 'Period', label: 'From', detail: '', value: range.from.toISOString().slice(0, 10), unit: 'date' },
      { section: 'Period', label: 'To', detail: '', value: range.to.toISOString().slice(0, 10), unit: 'date' },
      { section: 'Summary', label: 'Invoiced', detail: '', value: summary.invoiced.value, unit: 'money' },
      { section: 'Summary', label: 'Collected', detail: '', value: summary.collected.value, unit: 'money' },
      { section: 'Summary', label: 'Invoices issued', detail: '', value: summary.invoiceCount.value, unit: 'count' },
      { section: 'Summary', label: 'Average invoice', detail: '', value: summary.averageInvoice.value, unit: 'money' },
      { section: 'Summary', label: 'Outstanding', detail: '', value: summary.outstanding, unit: 'money' },
      { section: 'Summary', label: 'Overdue', detail: '', value: summary.overdue, unit: 'money' },
      ...customers.flatMap((row): Row[] => [
        { section: 'Customer', label: row.name, detail: 'Invoiced', value: row.invoiced, unit: 'money' },
        { section: 'Customer', label: row.name, detail: 'Outstanding', value: row.outstanding, unit: 'money' },
        { section: 'Customer', label: row.name, detail: 'Invoices', value: row.invoices, unit: 'count' },
      ]),
      ...products.flatMap((row): Row[] => [
        { section: 'Item', label: row.name, detail: row.sku ?? 'No SKU', value: row.revenue, unit: 'money' },
        { section: 'Item', label: row.name, detail: 'Quantity', value: row.quantity, unit: 'units' },
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

    return csvResponse(csv, exportFilename('sales-report'));
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return new Response('Forbidden', { status: 403 });
    }
    throw error;
  }
}
