import type { Metadata } from 'next';
import { Banknote, FileText, Receipt, TrendingUp } from 'lucide-react';

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
import { StatusBadge } from '@/components/shared/status-badge';
import { ReportNav } from '@/components/reports/report-nav';
import { RankedTable } from '@/components/reports/ranked-table';
import { ReportSeriesChart } from '@/components/charts/report-series-chart';
import { formatCurrency, formatNumber } from '@/lib/money';
import { formatDate, parsePreset, previousDateRange, resolveDateRange } from '@/lib/date';
import { hasPermission } from '@/lib/permissions';
import { requirePermission } from '@/server/tenant';
import { getInvoiceStatusBreakdown } from '@/server/services/dashboard';
import {
  getSalesByCustomer,
  getSalesByProduct,
  getSalesSummary,
  getSalesTrend,
} from '@/server/services/reports';

export const metadata: Metadata = { title: 'Sales report' };

export default async function SalesReportPage({
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

  const [summary, trend, byCustomer, byProduct, statuses] = await Promise.all([
    getSalesSummary(organizationId, range, previous),
    getSalesTrend(organizationId, range),
    getSalesByCustomer(organizationId, range),
    getSalesByProduct(organizationId, range),
    getInvoiceStatusBreakdown(organizationId, range),
  ]);

  const money = (value: number) => formatCurrency(value, { currency });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales"
        description={`What was invoiced and what came in, from ${formatDate(range.from)} to ${formatDate(range.to)}.`}
        actions={
          <>
            <DateRangeFilter preset={preset} />
            {hasPermission(context.permissions, 'reports.export') ? (
              <ExportButton endpoint="/reports/sales/export" />
            ) : null}
          </>
        }
      />

      <ReportNav />

      <section aria-label="Headline figures" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Invoiced"
          value={money(summary.invoiced.value)}
          change={summary.invoiced.change}
          icon={FileText}
        />
        <StatCard
          label="Collected"
          value={money(summary.collected.value)}
          change={summary.collected.change}
          icon={Banknote}
        />
        <StatCard
          label="Still outstanding"
          value={money(summary.outstanding)}
          icon={Receipt}
          footer={
            <span className="text-[11.5px] text-muted-foreground">
              {summary.overdue > 0
                ? `${money(summary.overdue)} of it past due`
                : 'Nothing past due'}
            </span>
          }
        />
        <StatCard
          label="Average invoice"
          value={money(summary.averageInvoice.value)}
          change={summary.averageInvoice.change}
          icon={TrendingUp}
          footer={
            <span className="text-[11.5px] text-muted-foreground">
              {formatNumber(summary.invoiceCount.value)} issued this period
            </span>
          }
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-[14px]">Invoiced against collected</CardTitle>
          <CardDescription>
            The gap between the two lines is work you have done but not yet been paid
            for.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportSeriesChart
            points={trend}
            currency={currency}
            series={[
              { key: 'invoiced', label: 'Invoiced', color: 'var(--chart-1)' },
              { key: 'collected', label: 'Collected', color: 'var(--chart-2)' },
            ]}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Customers</CardTitle>
            <CardDescription>Who this period&rsquo;s revenue came from.</CardDescription>
          </CardHeader>
          <CardContent>
            <RankedTable
              rows={byCustomer}
              keyOf={(row) => row.id}
              emptyTitle="No invoices in this period"
              emptyDescription="Pick a wider period, or issue an invoice and it will appear here."
              columns={[
                { header: 'Customer', cell: (row) => row.name },
                { header: 'Invoices', numeric: true, cell: (row) => row.invoices },
                {
                  header: 'Invoiced',
                  numeric: true,
                  cell: (row) => <span className="font-medium">{money(row.invoiced)}</span>,
                },
                {
                  header: 'Outstanding',
                  numeric: true,
                  cell: (row) => (
                    <span className={row.outstanding > 0 ? 'text-warning' : 'text-muted-foreground'}>
                      {money(row.outstanding)}
                    </span>
                  ),
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">What sold</CardTitle>
            <CardDescription>
              Counted from invoice lines, so a line typed by hand is included under its
              own name.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RankedTable
              rows={byProduct}
              keyOf={(row) => `${row.sku ?? ''}-${row.name}`}
              emptyTitle="Nothing sold in this period"
              columns={[
                {
                  header: 'Item',
                  cell: (row) => (
                    <div className="min-w-0">
                      <p className="truncate">{row.name}</p>
                      {row.sku ? (
                        <p className="text-[11.5px] text-muted-foreground">{row.sku}</p>
                      ) : null}
                    </div>
                  ),
                },
                {
                  header: 'Quantity',
                  numeric: true,
                  cell: (row) => formatNumber(row.quantity),
                },
                {
                  header: 'Revenue',
                  numeric: true,
                  cell: (row) => <span className="font-medium">{money(row.revenue)}</span>,
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[14px]">Where the invoices stand</CardTitle>
          <CardDescription>
            Every invoice issued in this period, by the state it is in now.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RankedTable
            rows={statuses}
            keyOf={(row) => row.status}
            emptyTitle="No invoices in this period"
            columns={[
              { header: 'Status', cell: (row) => <StatusBadge status={row.status} size="sm" /> },
              { header: 'Invoices', numeric: true, cell: (row) => row.count },
              {
                header: 'Value',
                numeric: true,
                cell: (row) => <span className="font-medium">{money(row.amount)}</span>,
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
