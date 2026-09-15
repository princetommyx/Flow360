import { csvResponse, exportFilename, toCsv } from '@/lib/csv';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { listPurchaseOrdersForExport } from '@/server/services/purchase-orders';
import { toNumber } from '@/lib/money';

export async function GET(request: Request) {
  try {
    const context = await requirePermission('purchases.export');

    const url = new URL(request.url);
    const params: SearchParams = Object.fromEntries(url.searchParams.entries());
    const query = parseListQuery(params, { sort: 'orderDate', dir: 'desc' });

    const orders = await listPurchaseOrdersForExport(context.organization.id, query);

    const csv = toCsv(orders, [
      { header: 'Number', value: (row) => row.number },
      {
        header: 'Supplier',
        value: (row) => row.supplier.companyName ?? row.supplier.name,
      },
      { header: 'Status', value: (row) => row.status },
      { header: 'Order date', value: (row) => row.orderDate.toISOString().slice(0, 10) },
      {
        header: 'Expected',
        value: (row) => row.expectedDate?.toISOString().slice(0, 10) ?? '',
      },
      { header: 'Lines', value: (row) => row._count.items },
      { header: 'Subtotal', value: (row) => toNumber(row.subtotal) },
      { header: 'Discount', value: (row) => toNumber(row.discountAmount) },
      { header: 'Tax', value: (row) => toNumber(row.taxAmount) },
      { header: 'Total', value: (row) => toNumber(row.total) },
      { header: 'Currency', value: (row) => row.currency },
      { header: 'Bills', value: (row) => row._count.bills },
    ]);

    return csvResponse(csv, exportFilename('purchase-orders'));
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return new Response('Forbidden', { status: 403 });
    }
    throw error;
  }
}
