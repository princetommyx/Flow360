import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowDownRight,
  ArrowUpRight,
  Boxes,
  Coins,
  Pencil,
  TrendingUp,
  Warehouse,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DetailList } from '@/components/shared/detail-list';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatCurrency, formatNumber, toNumber } from '@/lib/money';
import { formatDate } from '@/lib/date';
import { hasPermission } from '@/lib/permissions';
import { humanizeEnum } from '@/lib/utils';
import { requirePermission } from '@/server/tenant';
import {
  getProduct,
  getProductSummary,
  getStockHistory,
} from '@/server/services/products';

import { StockAdjustDialog } from './stock-adjust-dialog';

export const metadata: Metadata = { title: 'Product' };

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ adjust?: string }>;
}) {
  const [{ id }, { adjust }] = await Promise.all([params, searchParams]);
  const context = await requirePermission('products.view');
  const organizationId = context.organization.id;
  const currency = context.organization.currency;

  const product = await getProduct(organizationId, id);
  if (!product) notFound();

  const [summary, history] = await Promise.all([
    getProductSummary(organizationId, product.id),
    getStockHistory(organizationId, product.id),
  ]);

  const can = {
    edit: hasPermission(context.permissions, 'products.edit'),
    adjust: hasPermission(context.permissions, 'inventory.edit'),
  };

  const stock = toNumber(product.stockQuantity);
  const minimum = toNumber(product.minStockLevel);
  const isService = product.type === 'SERVICE';
  const isLow = product.trackInventory && stock <= minimum;

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        description={product.description ?? undefined}
        meta={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={product.status} />
            <Badge variant="neutral" size="sm">
              {isService ? 'Service' : 'Good'}
            </Badge>
            <Badge variant="outline" size="sm" className="font-mono">
              {product.sku}
            </Badge>
          </span>
        }
        actions={
          <>
            {can.adjust && product.trackInventory ? (
              <StockAdjustDialog
                productId={product.id}
                productName={product.name}
                unit={product.unit}
                currentStock={stock}
                openByDefault={adjust === '1'}
              />
            ) : null}
            {can.edit ? (
              <Button size="sm" asChild>
                <Link href={`/products/${product.id}/edit`}>
                  <Pencil /> Edit
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      {isLow ? (
        <Alert variant={stock <= 0 ? 'destructive' : 'warning'}>
          <AlertDescription className="text-foreground">
            {stock <= 0 ? (
              <>This item is <strong>out of stock</strong>.</>
            ) : (
              <>
                Only <strong>{formatNumber(stock, 0)} {product.unit}</strong> left,
                at or below the reorder point of {formatNumber(minimum, 0)}.
              </>
            )}{' '}
            {product.supplier ? `Usually supplied by ${product.supplier.name}.` : null}
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Selling price"
          value={formatCurrency(product.sellingPrice, { currency })}
          icon={Coins}
          footer={
            <span className="text-[11.5px] text-muted-foreground">
              {summary.margin === null
                ? `per ${product.unit}`
                : `${summary.margin}% margin per ${product.unit}`}
            </span>
          }
        />
        <StatCard
          label="Units sold"
          value={formatNumber(summary.unitsSold, 0)}
          icon={TrendingUp}
          footer={
            <span className="text-[11.5px] text-muted-foreground">
              Across {summary.invoiceCount} invoice line
              {summary.invoiceCount === 1 ? '' : 's'}
            </span>
          }
        />
        <StatCard
          label="Revenue"
          value={formatCurrency(summary.revenue, { currency })}
          icon={Boxes}
          footer={
            <span className="text-[11.5px] text-muted-foreground">
              Invoiced value to date
            </span>
          }
        />
        <StatCard
          label={product.trackInventory ? 'Stock on hand' : 'Stock'}
          value={
            product.trackInventory
              ? `${formatNumber(stock, 0)} ${product.unit}`
              : 'Not tracked'
          }
          icon={Warehouse}
          footer={
            <span className="text-[11.5px] text-muted-foreground">
              {product.trackInventory
                ? `${formatCurrency(summary.stockValueAtCost, { currency })} at cost`
                : 'Sold without holding stock'}
            </span>
          }
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <div>
              <CardTitle>Details</CardTitle>
              <CardDescription>How this item behaves on documents.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <DetailList
              columns={1}
              items={[
                { label: 'SKU', value: <span className="font-mono">{product.sku}</span> },
                { label: 'Barcode', value: product.barcode },
                { label: 'Category', value: product.category?.name },
                {
                  label: 'Supplier',
                  value: product.supplier ? (
                    <Link
                      href={`/suppliers/${product.supplier.id}`}
                      className="text-primary hover:underline"
                    >
                      {product.supplier.name}
                    </Link>
                  ) : null,
                },
                {
                  label: 'Purchase price',
                  value: formatCurrency(product.purchasePrice, { currency }),
                },
                { label: 'Tax rate', value: `${toNumber(product.taxRate)}%` },
                { label: 'Unit', value: product.unit },
                ...(product.trackInventory
                  ? [
                      {
                        label: 'Reorder point',
                        value: `${formatNumber(minimum, 0)} ${product.unit}`,
                      },
                      {
                        label: 'Stock value at sale price',
                        value: formatCurrency(summary.stockValueAtSale, { currency }),
                      },
                    ]
                  : []),
                { label: 'Added', value: formatDate(product.createdAt) },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>Stock history</CardTitle>
              <CardDescription>
                Every movement, with the balance it left behind.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            {!product.trackInventory ? (
              <EmptyState
                compact
                icon={Warehouse}
                title="Stock is not tracked"
                description="This item is sold without holding inventory, so there are no movements to show."
              />
            ) : history.length === 0 ? (
              <EmptyState
                compact
                icon={Warehouse}
                title="No movements yet"
                description="Stock changes appear here as you sell, receive or adjust this item."
              />
            ) : (
              <ul className="divide-y divide-border border-t border-border">
                {history.map((movement) => {
                  const delta = toNumber(movement.quantity);
                  const incoming = delta >= 0;
                  return (
                    <li
                      key={movement.id}
                      className="flex items-center gap-3 px-5 py-3"
                    >
                      <span
                        className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                          incoming
                            ? 'bg-success-soft text-success'
                            : 'bg-destructive-soft text-destructive'
                        }`}
                        aria-hidden
                      >
                        {incoming ? (
                          <ArrowUpRight className="size-3.5" />
                        ) : (
                          <ArrowDownRight className="size-3.5" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium">
                          {humanizeEnum(movement.type)}
                          {movement.reference ? (
                            <span className="ml-1.5 font-mono text-[12px] text-muted-foreground">
                              {movement.reference}
                            </span>
                          ) : null}
                        </p>
                        <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                          {movement.reason ?? '—'} · {formatDate(movement.occurredAt)}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p
                          className={`text-[13px] font-semibold tabular ${
                            incoming ? 'text-success' : 'text-foreground'
                          }`}
                        >
                          {incoming ? '+' : '−'}
                          {formatNumber(Math.abs(delta), 0)}
                        </p>
                        <p className="text-[11.5px] text-muted-foreground tabular">
                          {formatNumber(toNumber(movement.balanceAfter), 0)} left
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
