import type { Metadata } from 'next';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { ExportButton } from '@/components/shared/export-button';
import { CountUp } from '@/components/shared/count-up';
import { DateRangeFilter } from '@/components/shared/date-range-filter';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { parsePreset, resolveDateRange } from '@/lib/date';
import { formatCurrency } from '@/lib/money';
import { hasPermission } from '@/lib/permissions';
import { requirePermission } from '@/server/tenant';
import {
  accountOptions,
  incomeByCategory,
  listTransactions,
} from '@/server/services/transactions';

import { TransactionsTable } from '../transactions/transactions-table';

export const metadata: Metadata = { title: 'Income' };

export default async function IncomePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const context = await requirePermission('transactions.view');

  // The list query and the range share one set of search params, so the
  // period is read the same way the dashboard reads it.
  const preset = parsePreset(typeof params.period === 'string' ? params.period : null);
  const range = resolveDateRange(preset, {
    from: typeof params.from === 'string' ? params.from : null,
    to: typeof params.to === 'string' ? params.to : null,
  });
  const query = parseListQuery(params, { sort: 'occurredAt', dir: 'desc' });

  // The same ledger as /transactions, narrowed to money in over the period —
  // one source of truth rather than a second idea of what income means.
  const [{ rows, pageInfo, summary }, byCategory, accounts] = await Promise.all([
    listTransactions(context.organization.id, query, {
      type: 'INCOME',
      occurredAt: { gte: range.from, lte: range.to },
    }),
    incomeByCategory(context.organization.id, range.from, range.to),
    accountOptions(context.organization.id),
  ]);

  const can = {
    create: hasPermission(context.permissions, 'transactions.create'),
    edit: hasPermission(context.permissions, 'transactions.edit'),
    delete: hasPermission(context.permissions, 'transactions.delete'),
    export: hasPermission(context.permissions, 'transactions.export'),
  };

  const currency = context.organization.currency;
  const biggest = byCategory[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Income"
        description="Everything that came in over the period — invoiced or not."
        actions={
          <>
            <DateRangeFilter preset={preset} />
            {can.export ? <ExportButton /> : null}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">
            Received in this period
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular text-success">
            <CountUp value={summary.moneyIn} kind="currency" currency={currency} decimals={2} />
          </p>
        </Card>
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">Entries</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={pageInfo.total} decimals={0} />
          </p>
        </Card>
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">
            Largest source
          </p>
          <p className="mt-2 truncate text-2xl font-semibold tracking-[-0.02em]">
            {biggest?.category ?? '—'}
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground tabular">
            {biggest ? formatCurrency(biggest.total, { currency }) : 'Nothing yet'}
          </p>
        </Card>
      </div>

      {byCategory.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Where it came from</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {byCategory.map((row) => {
                const share =
                  summary.moneyIn > 0 ? (row.total / summary.moneyIn) * 100 : 0;
                return (
                  <li key={row.category}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="truncate text-[13.5px]">{row.category}</span>
                      <span className="shrink-0 text-[13.5px] font-medium tabular">
                        {formatCurrency(row.total, { currency })}
                      </span>
                    </div>
                    <div
                      className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
                      aria-hidden
                    >
                      <div
                        className="h-full rounded-full bg-success"
                        style={{ width: `${Math.max(2, share)}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11.5px] text-muted-foreground">
                      {row.count} entr{row.count === 1 ? 'y' : 'ies'} ·{' '}
                      {share.toFixed(1)}% of the period
                    </p>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <TransactionsTable
        rows={rows}
        pageInfo={pageInfo}
        isFiltered={Boolean(query.q) || Object.keys(query.filters).length > 0}
        currency={currency}
        accounts={accounts.map((account) => ({ id: account.id, name: account.name }))}
        can={can}
      />
    </div>
  );
}
