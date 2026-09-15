import { csvResponse, exportFilename, toCsv } from '@/lib/csv';
import { parsePreset, resolveDateRange } from '@/lib/date';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import {
  getInventorySummary,
  getStockAlerts,
  getStockByCategory,
  getStockMovements,
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

    const [summary, categories, movements, alerts] = await Promise.all([
      getInventorySummary(organizationId),
      getStockByCategory(organizationId),
      getStockMovements(organizationId, range, 500),
      getStockAlerts(organizationId, 500),
    ]);

    const rows: Row[] = [
      { section: 'Period', label: 'From', detail: '', value: range.from.toISOString().slice(0, 10), unit: 'date' },
      { section: 'Period', label: 'To', detail: '', value: range.to.toISOString().slice(0, 10), unit: 'date' },
      { section: 'Holding', label: 'Tracked items', detail: '', value: summary.trackedItems, unit: 'count' },
      { section: 'Holding', label: 'Units on hand', detail: '', value: summary.unitsOnHand, unit: 'units' },
      { section: 'Holding', label: 'Value at cost', detail: '', value: summary.costValue, unit: 'money' },
      { section: 'Holding', label: 'Value at selling price', detail: '', value: summary.retailValue, unit: 'money' },
      { section: 'Holding', label: 'Potential margin', detail: '', value: summary.potentialMargin, unit: 'money' },
      { section: 'Holding', label: 'Running low', detail: '', value: summary.lowStock, unit: 'count' },
      { section: 'Holding', label: 'Out of stock', detail: '', value: summary.outOfStock, unit: 'count' },
      ...categories.flatMap((row): Row[] => [
        { section: 'Category', label: row.name, detail: 'Value at cost', value: row.costValue, unit: 'money' },
        { section: 'Category', label: row.name, detail: 'Units', value: row.units, unit: 'units' },
        { section: 'Category', label: row.name, detail: 'Items', value: row.items, unit: 'count' },
      ]),
      { section: 'Movement', label: 'Received', detail: '', value: movements.received, unit: 'units' },
      { section: 'Movement', label: 'Sold', detail: '', value: movements.sold, unit: 'units' },
      { section: 'Movement', label: 'Returned', detail: '', value: movements.returned, unit: 'units' },
      { section: 'Movement', label: 'Corrections', detail: '', value: movements.adjusted, unit: 'units' },
      ...movements.movers.flatMap((row): Row[] => [
        { section: 'Item movement', label: row.name, detail: `${row.sku} in`, value: row.inQty, unit: 'units' },
        { section: 'Item movement', label: row.name, detail: `${row.sku} out`, value: row.outQty, unit: 'units' },
      ]),
      ...alerts.flatMap((row): Row[] => [
        { section: 'Reorder', label: row.name, detail: `${row.sku} on hand`, value: row.quantity, unit: 'units' },
        { section: 'Reorder', label: row.name, detail: `${row.sku} reorder at`, value: row.minimum, unit: 'units' },
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

    return csvResponse(csv, exportFilename('inventory-report'));
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return new Response('Forbidden', { status: 403 });
    }
    throw error;
  }
}
