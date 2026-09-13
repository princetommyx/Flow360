import { csvResponse, exportFilename, toCsv } from '@/lib/csv';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { listInvoicesForExport } from '@/server/services/invoices';
import { toNumber } from '@/lib/money';

export async function GET(request: Request) {
  try {
    const context = await requirePermission('invoices.export');

    const url = new URL(request.url);
    const params: SearchParams = Object.fromEntries(url.searchParams.entries());
    const query = parseListQuery(params, { sort: 'issueDate', dir: 'desc' });

    const invoices = await listInvoicesForExport(context.organization.id, query);

    const csv = toCsv(invoices, [
      { header: 'Number', value: (row) => row.number },
      {
        header: 'Customer',
        value: (row) => row.customer.companyName ?? row.customer.name,
      },
      { header: 'Status', value: (row) => row.status },
      { header: 'Issue date', value: (row) => row.issueDate.toISOString().slice(0, 10) },
      { header: 'Due date', value: (row) => row.dueDate.toISOString().slice(0, 10) },
      { header: 'Reference', value: (row) => row.reference },
      { header: 'Subtotal', value: (row) => toNumber(row.subtotal) },
      { header: 'Discount', value: (row) => toNumber(row.discountAmount) },
      { header: 'Tax', value: (row) => toNumber(row.taxAmount) },
      { header: 'Shipping', value: (row) => toNumber(row.shippingAmount) },
      { header: 'Total', value: (row) => toNumber(row.total) },
      { header: 'Paid', value: (row) => toNumber(row.amountPaid) },
      { header: 'Outstanding', value: (row) => toNumber(row.balanceDue) },
      { header: 'Currency', value: (row) => row.currency },
    ]);

    return csvResponse(csv, exportFilename('invoices'));
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return new Response('Forbidden', { status: 403 });
    }
    throw error;
  }
}
