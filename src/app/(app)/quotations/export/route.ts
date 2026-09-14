import { csvResponse, exportFilename, toCsv } from '@/lib/csv';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { listQuotationsForExport } from '@/server/services/quotations';
import { toNumber } from '@/lib/money';

export async function GET(request: Request) {
  try {
    const context = await requirePermission('quotations.export');

    const url = new URL(request.url);
    const params: SearchParams = Object.fromEntries(url.searchParams.entries());
    const query = parseListQuery(params, { sort: 'issueDate', dir: 'desc' });

    const quotations = await listQuotationsForExport(context.organization.id, query);

    const csv = toCsv(quotations, [
      { header: 'Number', value: (row) => row.number },
      {
        header: 'Customer',
        value: (row) => row.customer.companyName ?? row.customer.name,
      },
      { header: 'Status', value: (row) => row.status },
      { header: 'Issue date', value: (row) => row.issueDate.toISOString().slice(0, 10) },
      { header: 'Valid until', value: (row) => row.expiryDate.toISOString().slice(0, 10) },
      { header: 'Subtotal', value: (row) => toNumber(row.subtotal) },
      { header: 'Discount', value: (row) => toNumber(row.discountAmount) },
      { header: 'Tax', value: (row) => toNumber(row.taxAmount) },
      { header: 'Total', value: (row) => toNumber(row.total) },
      { header: 'Currency', value: (row) => row.currency },
      { header: 'Invoice', value: (row) => row.invoice?.number ?? '' },
    ]);

    return csvResponse(csv, exportFilename('quotations'));
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return new Response('Forbidden', { status: 403 });
    }
    throw error;
  }
}
