import type { Metadata } from 'next';
import { CreditCard, Layers, Receipt, TrendingDown } from 'lucide-react';

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
import { ShareBar } from '@/components/reports/share-bar';
import { ReportSeriesChart } from '@/components/charts/report-series-chart';
import { formatCurrency, formatNumber, formatRatio } from '@/lib/money';
import { formatDate, parsePreset, previousDateRange, resolveDateRange } from '@/lib/date';
import { hasPermission } from '@/lib/permissions';
import { requirePermission } from '@/server/tenant';
import {
  getExpenseSummary,
  getExpenseTrend,
  getExpensesByCategory,
  getExpensesBySupplier,
} from '@/server/services/reports';

export const metadata: Metadata = { title: 'Expense report' };

export default async function ExpenseReportPage({
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
  const previous = previousDateRange(preset, range);

  const [summary, trend, byCategory, bySupplier] = await Promise.all([
    getExpenseSummary(organizationId, range, previous),
    getExpenseTrend(organizationId, range),
    getExpensesByCategory(organizationId, range),
    getExpensesBySupplier(organizationId, range),
  ]);

  const money = (value: number) => formatCurrency(value, { currency });
  const biggest = byCategory[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description={`Where the money went, from ${formatDate(range.from)} to ${formatDate(range.to)}.`}
        actions={
          <>
            <DateRangeFilter preset={preset} />
            {hasPermission(context.permissions, 'reports.export') ? (
              <ExportButton endpoint="/reports/expenses/export" />
            ) : null}
          </>
        }
      />

      <ReportNav />

      <section aria-label="Headline figures" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Spent"
          value={money(summary.spent.value)}
          change={summary.spent.change}
          invertChange
          icon={TrendingDown}
          footer={
            <span className="text-[11.5px] text-muted-foreground">
              {formatNumber(summary.count.value)} expenses recorded
            </span>
          }
        />
        <StatCard
          label="Billed by suppliers"
          value={money(summary.billed.value)}
          change={summary.billed.change}
          invertChange
          icon={Receipt}
        />
        <StatCard
          label="Bills still owed"
          value={money(summary.unpaidBills)}
          icon={CreditCard}
        />
        <StatCard
          label="Biggest category"
          value={biggest ? money(biggest.total) : money(0)}
          icon={Layers}
          footer={
            <span className="text-[11.5px] text-muted-foreground">
              {biggest
                ? `${biggest.name}, ${formatRatio(biggest.share)} of spend`
                : 'Nothing spent in this period'}
            </span>
          }
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-[14px]">Spending over the period</CardTitle>
          <CardDescription>
            Expenses are what you paid out directly; bills are what suppliers invoiced
            you, paid or not.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportSeriesChart
            points={trend}
            currency={currency}
            kind="bar"
            series={[
              { key: 'expenses', label: 'Expenses', color: 'var(--chart-3)' },
              { key: 'bills', label: 'Bills', color: 'var(--chart-4)' },
            ]}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">By category</CardTitle>
            <CardDescription>
              Expenses with no category are grouped rather than hidden, so the total
              always adds up.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RankedTable
              rows={byCategory}
              keyOf={(row) => row.id ?? 'none'}
              emptyTitle="No expenses in this period"
              emptyDescription="Record an expense and it will be broken down here."
              columns={[
                {
                  header: 'Category',
                  className: 'w-1/2',
                  cell: (row) => (
                    <div className="min-w-0 pr-4">
                      <p className="truncate">{row.name}</p>
                      <ShareBar share={row.share} color={row.color} className="mt-1.5" />
                    </div>
                  ),
                },
                { header: 'Count', numeric: true, cell: (row) => row.count },
                { header: 'Share', numeric: true, cell: (row) => formatRatio(row.share) },
                {
                  header: 'Total',
                  numeric: true,
                  cell: (row) => <span className="font-medium">{money(row.total)}</span>,
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">By supplier</CardTitle>
            <CardDescription>
              Expenses and bills together, so a supplier you pay both ways appears once.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RankedTable
              rows={bySupplier}
              keyOf={(row) => row.id}
              emptyTitle="Nothing attributed to a supplier"
              emptyDescription="Expenses recorded without a supplier still count towards the categories."
              columns={[
                { header: 'Supplier', cell: (row) => row.name },
                { header: 'Documents', numeric: true, cell: (row) => row.count },
                {
                  header: 'Total',
                  numeric: true,
                  cell: (row) => <span className="font-medium">{money(row.total)}</span>,
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
