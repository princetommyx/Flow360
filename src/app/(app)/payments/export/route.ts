import { csvResponse, exportFilename, toCsv } from '@/lib/csv';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { listPaymentsForExport } from '@/server/services/payments';
import { toNumber } from '@/lib/money';

export async function GET(request: Request) {
  try {
    const context = await requirePermission('payments.export');

    const url = new URL(request.url);
    const params: SearchParams = Object.fromEntries(url.searchParams.entries());
    const query = parseListQuery(params, { sort: 'paidAt', dir: 'desc' });

    const payments = await listPaymentsForExport(context.organization.id, query);

    const csv = toCsv(payments, [
      { header: 'Number', value: (row) => row.number },
      { header: 'Received', value: (row) => row.paidAt.toISOString().slice(0, 10) },
      {
        header: 'Customer',
        value: (row) =>
          row.customer ? (row.customer.companyName ?? row.customer.name) : '',
      },
      { header: 'Invoice', value: (row) => row.invoice?.number ?? '' },
      { header: 'Method', value: (row) => row.method },
      { header: 'Account', value: (row) => row.account?.name ?? '' },
      { header: 'Reference', value: (row) => row.reference },
      { header: 'Amount', value: (row) => toNumber(row.amount) },
      { header: 'Currency', value: (row) => row.currency },
    ]);

    return csvResponse(csv, exportFilename('payments'));
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return new Response('Forbidden', { status: 403 });
    }
    throw error;
  }
}
