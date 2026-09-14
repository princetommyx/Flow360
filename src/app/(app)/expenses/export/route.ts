import { csvResponse, exportFilename, toCsv } from '@/lib/csv';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { listExpensesForExport } from '@/server/services/expenses';
import { toNumber } from '@/lib/money';

export async function GET(request: Request) {
  try {
    const context = await requirePermission('expenses.export');

    const url = new URL(request.url);
    const params: SearchParams = Object.fromEntries(url.searchParams.entries());
    const query = parseListQuery(params, { sort: 'spentAt', dir: 'desc' });

    const expenses = await listExpensesForExport(context.organization.id, query);

    const csv = toCsv(expenses, [
      { header: 'Number', value: (row) => row.number },
      { header: 'Date', value: (row) => row.spentAt.toISOString().slice(0, 10) },
      { header: 'Description', value: (row) => row.title },
      { header: 'Category', value: (row) => row.category?.name ?? '' },
      {
        header: 'Payee',
        value: (row) =>
          row.supplier ? (row.supplier.companyName ?? row.supplier.name) : (row.vendorName ?? ''),
      },
      { header: 'Account', value: (row) => row.account?.name ?? '' },
      { header: 'Method', value: (row) => row.method },
      { header: 'Status', value: (row) => row.status },
      { header: 'Amount', value: (row) => toNumber(row.amount) },
      { header: 'Tax', value: (row) => toNumber(row.taxAmount) },
      { header: 'Total', value: (row) => toNumber(row.total) },
      { header: 'Rebillable', value: (row) => (row.billable ? 'yes' : 'no') },
      { header: 'Reference', value: (row) => row.reference },
    ]);

    return csvResponse(csv, exportFilename('expenses'));
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return new Response('Forbidden', { status: 403 });
    }
    throw error;
  }
}
