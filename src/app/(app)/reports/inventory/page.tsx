import type { Metadata } from 'next';
import Link from 'next/link';
import { Boxes, PackageX, TrendingUp, Warehouse } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
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
import { formatCurrency, formatNumber } from '@/lib/money';
import { formatDate, parsePreset, resolveDateRange } from '@/lib/date';
import { hasPermission } from '@/lib/permissions';
import { requirePermission } from '@/server/tenant';
import {
  getInventorySummary,
  getStockAlerts,
  getStockByCategory,
  getStockMovements,
} from '@/server/services/reports';

export const metadata: Metadata = { title: 'Inventory report' };

export default async function InventoryReportPage({
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

  const [summary, byCategory, movements, alerts] = await Promise.all([
    getInventorySummary(organizationId),
    getStockByCategory(organizationId),
    getStockMovements(organizationId, range),
    getStockAlerts(organizationId),
  ]);

  const money = (value: number) => formatCurrency(value, { currency });
  const biggestCategory = byCategory[0]?.costValue ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description={`What you are holding today, and what moved from ${formatDate(range.from)} to ${formatDate(range.to)}.`}
        actions={
          <>
            <DateRangeFilter preset={preset} />
            {hasPermission(context.permissions, 'reports.export') ? (
              <ExportButton endpoint="/reports/inventory/export" />
            ) : null}
          </>
        }
      />

      <ReportNav />

      <section aria-label="Headline figures" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Stock at cost"
          value={money(summary.costValue)}
          icon={Warehouse}
          footer={
            <span className="text-[11.5px] text-muted-foreground">
              {formatNumber(summary.unitsOnHand)} units across{' '}
              {formatNumber(summary.trackedItems)} tracked items
            </span>
          }
        />
        <StatCard
          label="Stock at selling price"
          value={money(summary.retailValue)}
          icon={TrendingUp}
          footer={
            <span className="text-[11.5px] text-muted-foreground">
              {money(summary.potentialMargin)} of margin if it all sells
            </span>
          }
        />
        <StatCard
          label="Running low"
          value={formatNumber(summary.lowStock)}
          icon={Boxes}
          footer={
            <span className="text-[11.5px] text-muted-foreground">
              At or below their reorder point
            </span>
          }
        />
        <StatCard
          label="Out of stock"
          value={formatNumber(summary.outOfStock)}
          icon={PackageX}
          footer={
            <span className="text-[11.5px] text-muted-foreground">
              Nothing left to sell
            </span>
          }
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Where the value sits</CardTitle>
            <CardDescription>
              Holding at cost, by category. Uncategorised items are shown rather than
              dropped, so the figures add up to the total above.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RankedTable
              rows={byCategory}
              keyOf={(row) => row.id ?? 'none'}
              emptyTitle="Nothing is being tracked yet"
              emptyDescription="Turn on stock tracking for a product and it will appear here."
              columns={[
                {
                  header: 'Category',
                  className: 'w-1/2',
                  cell: (row) => (
                    <div className="min-w-0 pr-4">
                      <p className="truncate">{row.name}</p>
                      <ShareBar
                        share={biggestCategory > 0 ? (row.costValue / biggestCategory) * 100 : 0}
                        className="mt-1.5"
                      />
                    </div>
                  ),
                },
                { header: 'Items', numeric: true, cell: (row) => row.items },
                { header: 'Units', numeric: true, cell: (row) => formatNumber(row.units) },
                {
                  header: 'At cost',
                  numeric: true,
                  cell: (row) => <span className="font-medium">{money(row.costValue)}</span>,
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">What moved</CardTitle>
            <CardDescription>
              Every movement recorded in the period, whatever put it there.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Received', value: movements.received },
                { label: 'Sold', value: movements.sold },
                { label: 'Returned', value: movements.returned },
                { label: 'Corrections', value: movements.adjusted },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-border px-3 py-2.5">
                  <p className="text-[11.5px] text-muted-foreground">{item.label}</p>
                  <p className="tabular mt-0.5 text-[15px] font-semibold">
                    {formatNumber(item.value)}
                  </p>
                </div>
              ))}
            </div>

            <RankedTable
              rows={movements.movers}
              keyOf={(row) => row.id}
              emptyTitle="Nothing moved in this period"
              emptyDescription="Receive a purchase order or issue an invoice and the movements will show here."
              columns={[
                {
                  header: 'Item',
                  cell: (row) => (
                    <div className="min-w-0">
                      <Link href={`/products/${row.id}`} className="truncate hover:underline">
                        {row.name}
                      </Link>
                      <p className="text-[11.5px] text-muted-foreground">{row.sku}</p>
                    </div>
                  ),
                },
                { header: 'In', numeric: true, cell: (row) => formatNumber(row.inQty) },
                { header: 'Out', numeric: true, cell: (row) => formatNumber(row.outQty) },
              ]}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[14px]">Needs reordering</CardTitle>
          <CardDescription>
            Items at or below the reorder point you set, furthest behind first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RankedTable
            rows={alerts}
            keyOf={(row) => row.id}
            emptyTitle="Everything is above its reorder point"
            emptyDescription="Nothing needs buying right now."
            columns={[
              {
                header: 'Item',
                cell: (row) => (
                  <div className="min-w-0">
                    <Link href={`/products/${row.id}`} className="truncate hover:underline">
                      {row.name}
                    </Link>
                    <p className="text-[11.5px] text-muted-foreground">{row.sku}</p>
                  </div>
                ),
              },
              {
                header: 'On hand',
                numeric: true,
                cell: (row) =>
                  row.quantity <= 0 ? (
                    <Badge variant="destructive" size="sm">
                      Out of stock
                    </Badge>
                  ) : (
                    <span>
                      {formatNumber(row.quantity)} {row.unit}
                    </span>
                  ),
              },
              {
                header: 'Reorder at',
                numeric: true,
                cell: (row) => formatNumber(row.minimum),
              },
              {
                header: 'Value held',
                numeric: true,
                cell: (row) => money(row.costValue),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}
