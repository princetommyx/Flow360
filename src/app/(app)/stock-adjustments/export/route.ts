import { csvResponse, exportFilename, toCsv } from '@/lib/csv';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { listStockMovementsForExport } from '@/server/services/inventory';
import { toNumber } from '@/lib/money';

export async function GET(request: Request) {
  try {
    const context = await requirePermission('inventory.export');

    const url = new URL(request.url);
    const params: SearchParams = Object.fromEntries(url.searchParams.entries());
    const query = parseListQuery(params, { sort: 'occurredAt', dir: 'desc' });

    const movements = await listStockMovementsForExport(context.organization.id, query);

    const csv = toCsv(movements, [
      { header: 'When', value: (row) => row.occurredAt.toISOString().slice(0, 10) },
      { header: 'SKU', value: (row) => row.product.sku },
      { header: 'Product', value: (row) => row.product.name },
      { header: 'Type', value: (row) => row.type },
      { header: 'Change', value: (row) => toNumber(row.quantity) },
      { header: 'Balance after', value: (row) => toNumber(row.balanceAfter) },
      { header: 'Unit', value: (row) => row.product.unit },
      { header: 'Reason', value: (row) => row.reason },
      { header: 'Reference', value: (row) => row.reference },
    ]);

    return csvResponse(csv, exportFilename('stock-movements'));
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return new Response('Forbidden', { status: 403 });
    }
    throw error;
  }
}
