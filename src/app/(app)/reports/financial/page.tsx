import type { Metadata } from 'next';
import { ArrowDownLeft, ArrowUpRight, Scale, Wallet } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { DateRangeFilter } from '@/components/shared/date-range-filter';
import { ExportButton } from '@/components/shared/export-button';
import { ReportNav } from '@/components/reports/report-nav';
import { RankedTable } from '@/components/reports/ranked-table';
import { ReportSeriesChart } from '@/components/charts/report-series-chart';
import { formatCurrency, formatPercent } from '@/lib/money';
import { formatDate, parsePreset, resolveDateRange } from '@/lib/date';
import { hasPermission } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { requirePermission } from '@/server/tenant';
import {
  getCashFlow,
  getCashPosition,
  getProfitAndLoss,
} from '@/server/services/reports';

export const metadata: Metadata = { title: 'Profit and loss' };

const ACCOUNT_LABELS: Record<string, string> = {
  BANK: 'Bank',
  CASH: 'Cash',
  MOBILE_MONEY: 'Mobile money',
  CREDIT_CARD: 'Credit card',
  OTHER: 'Other',
};

/** One line of the statement. `emphasis` marks a subtotal, not a component. */
function StatementRow({
  label,
  hint,
  value,
  emphasis,
  negative,
}: {
  label: string;
  hint?: string;
  value: string;
  emphasis?: boolean;
  negative?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-baseline justify-between gap-4 py-2.5',
        emphasis
          ? 'border-t border-border font-semibold'
          : 'border-b border-border/60 last:border-0',
      )}
    >
      <div className="min-w-0">
        <p className={cn('text-[13px]', emphasis && 'text-[13.5px]')}>{label}</p>
        {hint ? (
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">{hint}</p>
        ) : null}
      </div>
      <p className={cn('tabular shrink-0 text-[13px]', negative && 'text-muted-foreground')}>
        {negative ? `(${value})` : value}
      </p>
    </div>
  );
}

export default async function FinancialReportPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const context = await requirePermission('reports.view');
  const organizationId = context.organization.id;
  const currency = context.organization.currency;

  const preset = parsePreset(params.period);
  const range = resolveDateRange(preset, { from: params.from, to: params.to });

  const [pnl, cash, accounts] = await Promise.all([
    getProfitAndLoss(organizationId, range),
    getCashFlow(organizationId, range),
    getCashPosition(organizationId),
  ]);

  const money = (value: number) => formatCurrency(value, { currency });
  const cashTotal = accounts.reduce((sum, account) => sum + account.balance, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profit and loss"
        description={`What the business earned and what it cost, from ${formatDate(range.from)} to ${formatDate(range.to)}.`}
        actions={
          <>
            <DateRangeFilter preset={preset} />
            {hasPermission(context.permissions, 'reports.export') ? (
              <ExportButton endpoint="/reports/financial/export" />
            ) : null}
          </>
        }
      />

      <ReportNav />

      <section aria-label="Headline figures" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          value={money(pnl.revenue)}
          icon={ArrowUpRight}
          footer={
            <span className="text-[11.5px] text-muted-foreground">
              Invoiced in this period
            </span>
          }
        />
        <StatCard
          label="Gross profit"
          value={money(pnl.grossProfit)}
          icon={Scale}
          footer={
            <span className="text-[11.5px] text-muted-foreground">
              {formatPercent(pnl.grossMargin)} margin
            </span>
          }
        />
        <StatCard
          label="Net profit"
          value={money(pnl.netProfit)}
          icon={Wallet}
          footer={
            <span className="text-[11.5px] text-muted-foreground">
              {formatPercent(pnl.netMargin)} of revenue
            </span>
          }
        />
        <StatCard
          label="Cash on hand"
          value={money(cashTotal)}
          icon={ArrowDownLeft}
          footer={
            <span className="text-[11.5px] text-muted-foreground">
              Across {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}, today
            </span>
          }
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] [&>*]:min-w-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">The statement</CardTitle>
            <CardDescription>
              Revenue is what was invoiced in the period, not what was collected. A
              report that moved with payments would credit January&rsquo;s work to March.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StatementRow
              label="Revenue"
              hint="Invoices issued, excluding drafts and cancellations"
              value={money(pnl.revenue)}
            />
            <StatementRow
              label="Purchases"
              hint="Bills received from suppliers"
              value={money(pnl.purchases)}
              negative
            />
            <StatementRow label="Gross profit" value={money(pnl.grossProfit)} emphasis />

            <p className="mt-6 text-[11.5px] font-medium uppercase tracking-wider text-muted-foreground">
              Operating expenses
            </p>
            <div className="mt-1">
              {pnl.operatingExpenses.length === 0 ? (
                <StatementRow label="None recorded" value={money(0)} />
              ) : (
                pnl.operatingExpenses.map((row) => (
                  <StatementRow
                    key={row.id ?? 'none'}
                    label={row.name}
                    hint={`${row.count} ${row.count === 1 ? 'expense' : 'expenses'}`}
                    value={money(row.total)}
                    negative
                  />
                ))
              )}
              <StatementRow
                label="Payroll"
                hint="Payslips approved or paid in the period"
                value={money(pnl.payroll)}
                negative
              />
              <StatementRow
                label="Total operating cost"
                value={money(pnl.operatingTotal + pnl.payroll)}
                emphasis
              />
            </div>

            <div className="mt-6 rounded-lg border border-border bg-surface-subtle px-4 py-3">
              <div className="flex items-baseline justify-between gap-4">
                <p className="text-[13.5px] font-semibold">Net profit</p>
                <p
                  className={cn(
                    'tabular text-[17px] font-semibold',
                    pnl.netProfit < 0 ? 'text-destructive' : 'text-success',
                  )}
                >
                  {money(pnl.netProfit)}
                </p>
              </div>
              <p className="mt-1 text-[11.5px] text-muted-foreground">
                {formatPercent(pnl.netMargin)} of revenue over this period.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-[14px]">Cash on hand</CardTitle>
              <CardDescription>
                Balances as they stand now, not as at the end of the period.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RankedTable
                rows={accounts}
                keyOf={(row) => row.id}
                emptyTitle="No accounts yet"
                emptyDescription="Add an account and its balance will appear here."
                columns={[
                  {
                    header: 'Account',
                    cell: (row) => (
                      <div className="min-w-0">
                        <p className="truncate">{row.name}</p>
                        <p className="text-[11.5px] text-muted-foreground">
                          {ACCOUNT_LABELS[row.type] ?? row.type}
                        </p>
                      </div>
                    ),
                  },
                  {
                    header: 'Balance',
                    numeric: true,
                    cell: (row) => (
                      <span
                        className={cn('font-medium', row.balance < 0 && 'text-destructive')}
                      >
                        {formatCurrency(row.balance, { currency: row.currency })}
                      </span>
                    ),
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[14px]">Money in and out</CardTitle>
              <CardDescription>
                From the transaction ledger. Transfers between your own accounts are
                left out, because they move money without changing how much you have.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-[11.5px] text-muted-foreground">In</p>
                  <p className="tabular mt-0.5 text-[15px] font-semibold text-success">
                    {money(cash.inflow)}
                  </p>
                </div>
                <div>
                  <p className="text-[11.5px] text-muted-foreground">Out</p>
                  <p className="tabular mt-0.5 text-[15px] font-semibold text-destructive">
                    {money(cash.outflow)}
                  </p>
                </div>
                <div>
                  <p className="text-[11.5px] text-muted-foreground">Net</p>
                  <p className="tabular mt-0.5 text-[15px] font-semibold">
                    {money(cash.net)}
                  </p>
                </div>
              </div>

              <ReportSeriesChart
                points={cash.series}
                currency={currency}
                kind="bar"
                height="12rem"
                series={[
                  { key: 'in', label: 'In', color: 'var(--chart-2)' },
                  { key: 'out', label: 'Out', color: 'var(--chart-3)' },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
