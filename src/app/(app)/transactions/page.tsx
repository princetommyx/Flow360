import type { Metadata } from 'next';

import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { ExportButton } from '@/components/shared/export-button';
import { CountUp } from '@/components/shared/count-up';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { hasPermission } from '@/lib/permissions';
import { formatPercent } from '@/lib/money';
import { requirePermission } from '@/server/tenant';
import {
  accountOptions,
  cashSummary,
  listTransactions,
} from '@/server/services/transactions';

import { TransactionsTable } from './transactions-table';

export const metadata: Metadata = { title: 'Transactions' };

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const context = await requirePermission('transactions.view');

  const query = parseListQuery(params, { sort: 'occurredAt', dir: 'desc' });
  const [{ rows, pageInfo, summary }, cash, accounts] = await Promise.all([
    listTransactions(context.organization.id, query),
    cashSummary(context.organization.id),
    accountOptions(context.organization.id),
  ]);

  const can = {
    create: hasPermission(context.permissions, 'transactions.create'),
    edit: hasPermission(context.permissions, 'transactions.edit'),
    delete: hasPermission(context.permissions, 'transactions.delete'),
    export: hasPermission(context.permissions, 'transactions.export'),
  };

  const currency = context.organization.currency;
  const change =
    cash.previousNet !== 0
      ? ((cash.net - cash.previousNet) / Math.abs(cash.previousNet)) * 100
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="Every movement of money, wherever it came from."
        actions={can.export ? <ExportButton /> : null}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">Cash on hand</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={cash.cashOnHand} kind="currency" currency={currency} decimals={2} />
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">Across active accounts</p>
        </Card>
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">
            In this month
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular text-success">
            <CountUp value={cash.moneyIn} kind="currency" currency={currency} decimals={2} />
          </p>
        </Card>
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">
            Out this month
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={cash.moneyOut} kind="currency" currency={currency} decimals={2} />
          </p>
        </Card>
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">
            Net this month
          </p>
          <p
            className={
              cash.net >= 0
                ? 'mt-2 text-2xl font-semibold tracking-[-0.02em] tabular'
                : 'mt-2 text-2xl font-semibold tracking-[-0.02em] tabular text-destructive'
            }
          >
            <CountUp value={cash.net} kind="currency" currency={currency} decimals={2} />
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {change === null
              ? 'No movement last month to compare'
              : `${formatPercent(change)} vs last month`}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-[12px] text-muted-foreground">In, matching this view</p>
          <p className="mt-1 text-[17px] font-semibold tabular text-success">
            <CountUp value={summary.moneyIn} kind="currency" currency={currency} decimals={2} />
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[12px] text-muted-foreground">Out, matching this view</p>
          <p className="mt-1 text-[17px] font-semibold tabular">
            <CountUp value={summary.moneyOut} kind="currency" currency={currency} decimals={2} />
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[12px] text-muted-foreground">Net, matching this view</p>
          <p className="mt-1 text-[17px] font-semibold tabular">
            <CountUp value={summary.net} kind="currency" currency={currency} decimals={2} />
          </p>
        </Card>
      </div>

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
