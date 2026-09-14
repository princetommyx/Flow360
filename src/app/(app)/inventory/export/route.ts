import { csvResponse, exportFilename, toCsv } from '@/lib/csv';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { listStockLevelsForExport } from '@/server/services/inventory';
import { round, toNumber } from '@/lib/money';

export async function GET(request: Request) {
  try {
    const context = await requirePermission('inventory.export');

    const url = new URL(request.url);
    const params: SearchParams = Object.fromEntries(url.searchParams.entries());
    const query = parseListQuery(params, { sort: 'name', dir: 'asc' });

    const products = await listStockLevelsForExport(context.organization.id, query);

    const csv = toCsv(products, [
      { header: 'SKU', value: (row) => row.sku },
      { header: 'Product', value: (row) => row.name },
      { header: 'Category', value: (row) => row.category?.name ?? '' },
      { header: 'Unit', value: (row) => row.unit },
      { header: 'On hand', value: (row) => toNumber(row.stockQuantity) },
      { header: 'Reorder at', value: (row) => toNumber(row.minStockLevel) },
      { header: 'Unit cost', value: (row) => toNumber(row.purchasePrice) },
      {
        header: 'Stock value',
        value: (row) => round(toNumber(row.stockQuantity) * toNumber(row.purchasePrice)),
      },
    ]);

    return csvResponse(csv, exportFilename('inventory'));
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return new Response('Forbidden', { status: 403 });
    }
    throw error;
  }
}
