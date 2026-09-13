import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Boxes,
  FileWarning,
  PackageX,
  Receipt,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { CountUp } from '@/components/shared/count-up';
import { StatusBadge } from '@/components/shared/status-badge';
import { DateRangeFilter } from '@/components/shared/date-range-filter';
import { RevenueTrendChart } from '@/components/charts/revenue-trend-chart';
import { SalesOverviewChart } from '@/components/charts/sales-overview-chart';
import { TopProductsChart } from '@/components/charts/top-products-chart';
import { formatCurrency, formatNumber, toNumber } from '@/lib/money';
import { formatDate, parsePreset, previousDateRange, resolveDateRange } from '@/lib/date';
import { initials } from '@/lib/utils';
import { requirePermission } from '@/server/tenant';
import {
  getDashboardSummary,
  getInvoiceStatusBreakdown,
  getLowStockProducts,
  getRecentActivity,
  getRevenueTrend,
  getTopProducts,
} from '@/server/services/dashboard';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const context = await requirePermission('dashboard.view');
  const organizationId = context.organization.id;

  const preset = parsePreset(params.period);
  const range = resolveDateRange(preset, { from: params.from, to: params.to });
  const previous = previousDateRange(preset, range);

  const [summary, trend, statusBreakdown, topProducts, lowStock, activity] =
    await Promise.all([
      getDashboardSummary(organizationId, range, previous),
      getRevenueTrend(organizationId, range),
      getInvoiceStatusBreakdown(organizationId, range),
      getTopProducts(organizationId, range),
      getLowStockProducts(organizationId),
      getRecentActivity(organizationId),
    ]);

  const currency = context.organization.currency;
  const firstName = context.user.name.split(' ')[0];
  const hasTrendData = trend.some((point) => point.revenue > 0 || point.expenses > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Good to see you, ${firstName}`}
        description={`Here's how ${context.organization.name} is performing from ${formatDate(range.from)} to ${formatDate(range.to)}.`}
        actions={<DateRangeFilter preset={preset} />}
      />

      <section
        aria-label="Key metrics"
        className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          label="Total revenue"
          value={<CountUp value={summary.revenue.value} kind="currency" currency={currency} decimals={2} />}
          change={summary.revenue.change}
          icon={TrendingUp}
        />
        <StatCard
          label="Outstanding invoices"
          value={<CountUp value={summary.outstanding} kind="currency" currency={currency} decimals={2} />}
          icon={FileWarning}
          footer={
            <span className="text-[11.5px] text-muted-foreground">
              {summary.overdueCount > 0
                ? `${summary.overdueCount} past due`
                : 'Nothing past due'}
            </span>
          }
        />
        <StatCard
          label="Total expenses"
          value={<CountUp value={summary.expenses.value} kind="currency" currency={currency} decimals={2} />}
          change={summary.expenses.change}
          invertChange
          icon={TrendingDown}
        />
        <StatCard
          label="Net profit"
          value={<CountUp value={summary.netProfit.value} kind="currency" currency={currency} decimals={2} />}
          change={summary.netProfit.change}
          icon={Wallet}
        />
      </section>

      <section aria-label="Business counts" className="stagger grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Active customers"
          value={<CountUp value={summary.customers} />}
          icon={Users}
          footer={
            <span className="text-[11.5px] text-muted-foreground">
              {summary.newCustomers} added this period
            </span>
          }
        />
        <StatCard
          label="Products & services"
          value={<CountUp value={summary.products} />}
          icon={Boxes}
          footer={
            <span className="text-[11.5px] text-muted-foreground">
              In the active catalogue
            </span>
          }
        />
        <StatCard
          label="Low stock items"
          value={<CountUp value={summary.lowStockCount} />}
          icon={PackageX}
          footer={
            <span className="text-[11.5px] text-muted-foreground">
              {summary.lowStockCount > 0 ? 'Reorder needed' : 'Stock levels healthy'}
            </span>
          }
        />
      </section>

      <section className="animate-fade grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Revenue &amp; expenses</CardTitle>
              <CardDescription>
                Invoiced value against recorded spend over the selected period.
              </CardDescription>
            </div>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/reports/financial">
                  Full report <ArrowRight />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {hasTrendData ? (
              <RevenueTrendChart data={trend} />
            ) : (
              <EmptyState
                compact
                icon={TrendingUp}
                title="No activity in this period"
                description="Issue an invoice or record an expense and the trend will appear here."
                action={
                  <Button size="sm" asChild>
                    <Link href="/invoices/new">Create an invoice</Link>
                  </Button>
                }
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Sales overview</CardTitle>
              <CardDescription>Invoiced value by status.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {statusBreakdown.length > 0 ? (
              <SalesOverviewChart data={statusBreakdown} />
            ) : (
              <EmptyState
                compact
                icon={Receipt}
                title="No invoices yet"
                description="Statuses appear once you start issuing invoices."
              />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Recent invoices</CardTitle>
              <CardDescription>The last six invoices raised.</CardDescription>
            </div>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/invoices">
                  View all <ArrowRight />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {activity.invoices.length === 0 ? (
              <EmptyState
                compact
                icon={Receipt}
                title="No invoices yet"
                description="Create your first invoice to start tracking receivables."
                action={
                  <Button size="sm" asChild>
                    <Link href="/invoices/new">New invoice</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-border border-t border-border">
                {activity.invoices.map((invoice) => (
                  <li key={invoice.id}>
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-subtle"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-[13.5px] font-medium">
                          <span className="font-mono text-[12.5px]">{invoice.number}</span>
                          <StatusBadge status={invoice.status} size="sm" />
                        </p>
                        <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">
                          {invoice.customer.name} · due {formatDate(invoice.dueDate)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-[13.5px] font-semibold tabular">
                          {formatCurrency(invoice.total, { currency })}
                        </p>
                        {toNumber(invoice.balanceDue) > 0 ? (
                          <p className="text-[11.5px] text-muted-foreground tabular">
                            {formatCurrency(invoice.balanceDue, { currency })} due
                          </p>
                        ) : null}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Top selling products</CardTitle>
              <CardDescription>By invoiced value this period.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <TopProductsChart data={topProducts} />
            ) : (
              <EmptyState
                compact
                icon={Boxes}
                title="Nothing sold yet"
                description="Add products to invoices to see your best sellers."
              />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent transactions</CardTitle>
              <CardDescription>Money in and out of your accounts.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {activity.transactions.length === 0 ? (
              <EmptyState
                compact
                icon={Wallet}
                title="No transactions"
                description="Record a payment or expense to populate the ledger."
              />
            ) : (
              <ul className="divide-y divide-border border-t border-border">
                {activity.transactions.map((transaction) => {
                  const amount = toNumber(transaction.amount);
                  return (
                    <li
                      key={transaction.id}
                      className="flex items-center gap-3 px-5 py-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">
                          {transaction.description}
                        </p>
                        <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                          {transaction.account.name} · {formatDate(transaction.occurredAt)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-[13px] font-semibold tabular ${
                          amount >= 0 ? 'text-success' : 'text-foreground'
                        }`}
                      >
                        {amount >= 0 ? '+' : '−'}
                        {formatCurrency(Math.abs(amount), { currency })}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent customers</CardTitle>
              <CardDescription>Newest additions to your CRM.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {activity.customers.length === 0 ? (
              <EmptyState
                compact
                icon={Users}
                title="No customers yet"
                description="Add a customer to start quoting and invoicing."
                action={
                  <Button size="sm" asChild>
                    <Link href="/customers/new">Add customer</Link>
                  </Button>
                }
              />
            ) : (
              <ul className="divide-y divide-border border-t border-border">
                {activity.customers.map((customer) => (
                  <li key={customer.id}>
                    <Link
                      href={`/customers/${customer.id}`}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-subtle"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary">
                        {initials(customer.companyName ?? customer.name)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">
                          {customer.companyName ?? customer.name}
                        </p>
                        <p className="truncate text-[12px] text-muted-foreground">
                          {customer.email ?? customer.name}
                        </p>
                      </div>
                      <span className="shrink-0 text-[11.5px] text-muted-foreground">
                        {formatDate(customer.createdAt, 'dd MMM')}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Low stock</CardTitle>
              <CardDescription>Items at or below their reorder point.</CardDescription>
            </div>
            <CardAction>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/inventory">
                  Inventory <ArrowRight />
                </Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {lowStock.length === 0 ? (
              <EmptyState
                compact
                icon={Boxes}
                title="Stock levels are healthy"
                description="Nothing has dropped below its minimum level."
              />
            ) : (
              <ul className="divide-y divide-border border-t border-border">
                {lowStock.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/products/${product.id}`}
                      className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-subtle"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-medium">{product.name}</p>
                        <p className="truncate font-mono text-[11.5px] text-muted-foreground">
                          {product.sku}
                        </p>
                      </div>
                      <Badge
                        variant={product.stockQuantity <= 0 ? 'destructive' : 'warning'}
                        size="sm"
                        className="shrink-0 tabular"
                      >
                        {product.stockQuantity <= 0
                          ? 'Out of stock'
                          : `${formatNumber(product.stockQuantity, 0)} left · min ${formatNumber(product.minStockLevel, 0)}`}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
