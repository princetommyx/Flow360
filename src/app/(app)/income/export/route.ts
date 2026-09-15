import { csvResponse, exportFilename, toCsv } from '@/lib/csv';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { parsePreset, resolveDateRange } from '@/lib/date';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { listTransactionsForExport } from '@/server/services/transactions';
import { toNumber } from '@/lib/money';

export async function GET(request: Request) {
  try {
    const context = await requirePermission('transactions.export');

    const url = new URL(request.url);
    const params: SearchParams = Object.fromEntries(url.searchParams.entries());
    const query = parseListQuery(params, { sort: 'occurredAt', dir: 'desc' });

    // The same narrowing the page applies, so the file matches the screen.
    const preset = parsePreset(typeof params.period === 'string' ? params.period : null);
    const range = resolveDateRange(preset, {
      from: typeof params.from === 'string' ? params.from : null,
      to: typeof params.to === 'string' ? params.to : null,
    });

    const rows = await listTransactionsForExport(context.organization.id, query, {
      type: 'INCOME',
      occurredAt: { gte: range.from, lte: range.to },
    });

    const csv = toCsv(rows, [
      { header: 'Date', value: (row) => row.occurredAt.toISOString().slice(0, 10) },
      { header: 'Description', value: (row) => row.description },
      { header: 'Category', value: (row) => row.category ?? '' },
      { header: 'Account', value: (row) => row.account.name },
      { header: 'Amount', value: (row) => toNumber(row.amount) },
      { header: 'Reference', value: (row) => row.reference ?? '' },
      { header: 'Invoice', value: (row) => row.invoice?.number ?? '' },
    ]);

    return csvResponse(csv, exportFilename('income'));
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return new Response('Forbidden', { status: 403 });
    }
    throw error;
  }
}
