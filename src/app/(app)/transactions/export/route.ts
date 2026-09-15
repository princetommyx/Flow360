import { csvResponse, exportFilename, toCsv } from '@/lib/csv';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { listTransactionsForExport } from '@/server/services/transactions';
import { toNumber } from '@/lib/money';

export async function GET(request: Request) {
  try {
    const context = await requirePermission('transactions.export');

    const url = new URL(request.url);
    const params: SearchParams = Object.fromEntries(url.searchParams.entries());
    const query = parseListQuery(params, { sort: 'occurredAt', dir: 'desc' });

    const rows = await listTransactionsForExport(context.organization.id, query);

    const csv = toCsv(rows, [
      { header: 'Date', value: (row) => row.occurredAt.toISOString().slice(0, 10) },
      { header: 'Kind', value: (row) => row.type },
      { header: 'Description', value: (row) => row.description },
      { header: 'Category', value: (row) => row.category ?? '' },
      { header: 'Account', value: (row) => row.account.name },
      { header: 'To account', value: (row) => row.toAccount?.name ?? '' },
      { header: 'Amount', value: (row) => toNumber(row.amount) },
      { header: 'Reference', value: (row) => row.reference ?? '' },
      {
        header: 'Document',
        value: (row) =>
          row.invoice?.number ?? row.bill?.number ?? row.expense?.number ?? '',
      },
    ]);

    return csvResponse(csv, exportFilename('transactions'));
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return new Response('Forbidden', { status: 403 });
    }
    throw error;
  }
}
