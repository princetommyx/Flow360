import { csvResponse, exportFilename, toCsv } from '@/lib/csv';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { listProductsForExport } from '@/server/services/products';
import { toNumber } from '@/lib/money';

export async function GET(request: Request) {
  try {
    const context = await requirePermission('products.export');

    const url = new URL(request.url);
    const params: SearchParams = Object.fromEntries(url.searchParams.entries());
    const query = parseListQuery(params, { sort: 'name', dir: 'asc' });

    const products = await listProductsForExport(context.organization.id, query);

    const csv = toCsv(products, [
      { header: 'Name', value: (row) => row.name },
      { header: 'SKU', value: (row) => row.sku },
      { header: 'Barcode', value: (row) => row.barcode },
      { header: 'Type', value: (row) => row.type },
      { header: 'Category', value: (row) => row.category?.name },
      { header: 'Supplier', value: (row) => row.supplier?.name },
      { header: 'Unit', value: (row) => row.unit },
      { header: 'Purchase price', value: (row) => toNumber(row.purchasePrice) },
      { header: 'Selling price', value: (row) => toNumber(row.sellingPrice) },
      { header: 'Tax rate (%)', value: (row) => toNumber(row.taxRate) },
      { header: 'Stock quantity', value: (row) => toNumber(row.stockQuantity) },
      { header: 'Minimum level', value: (row) => toNumber(row.minStockLevel) },
      { header: 'Tracks inventory', value: (row) => (row.trackInventory ? 'yes' : 'no') },
      { header: 'Status', value: (row) => row.status },
    ]);

    return csvResponse(csv, exportFilename('products'));
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return new Response('Forbidden', { status: 403 });
    }
    throw error;
  }
}
