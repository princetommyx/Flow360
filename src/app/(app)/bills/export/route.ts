import { csvResponse, exportFilename, toCsv } from '@/lib/csv';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { listBillsForExport } from '@/server/services/bills';
import { toNumber } from '@/lib/money';

export async function GET(request: Request) {
  try {
    const context = await requirePermission('bills.export');

    const url = new URL(request.url);
    const params: SearchParams = Object.fromEntries(url.searchParams.entries());
    const query = parseListQuery(params, { sort: 'issueDate', dir: 'desc' });

    const bills = await listBillsForExport(context.organization.id, query);

    const csv = toCsv(bills, [
      { header: 'Number', value: (row) => row.number },
      {
        header: 'Supplier',
        value: (row) => row.supplier.companyName ?? row.supplier.name,
      },
      { header: 'Supplier reference', value: (row) => row.supplierRef ?? '' },
      { header: 'Purchase order', value: (row) => row.purchaseOrder?.number ?? '' },
      { header: 'Status', value: (row) => row.status },
      { header: 'Issue date', value: (row) => row.issueDate.toISOString().slice(0, 10) },
      { header: 'Due date', value: (row) => row.dueDate.toISOString().slice(0, 10) },
      { header: 'Subtotal', value: (row) => toNumber(row.subtotal) },
      { header: 'Tax', value: (row) => toNumber(row.taxAmount) },
      { header: 'Total', value: (row) => toNumber(row.total) },
      { header: 'Paid', value: (row) => toNumber(row.amountPaid) },
      { header: 'Outstanding', value: (row) => toNumber(row.balanceDue) },
      { header: 'Currency', value: (row) => row.currency },
    ]);

    return csvResponse(csv, exportFilename('bills'));
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return new Response('Forbidden', { status: 403 });
    }
    throw error;
  }
}
