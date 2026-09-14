'use client';

import Link from 'next/link';
import { PackageSearch } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/data-table/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { formatNumber } from '@/lib/money';
import { formatDate } from '@/lib/date';
import { humanizeEnum } from '@/lib/utils';
import type { PageInfo } from '@/lib/query';
import type { StockMovementRow } from '@/server/services/inventory';

/** Movement types, coloured by whether stock came in or went out. */
const TONE: Record<string, 'success' | 'destructive' | 'neutral'> = {
  STOCK_IN: 'success',
  PURCHASE: 'success',
  RETURN_IN: 'success',
  STOCK_OUT: 'destructive',
  SALE: 'destructive',
  RETURN_OUT: 'destructive',
  ADJUSTMENT: 'neutral',
};

export function MovementsTable({
  rows,
  pageInfo,
  isFiltered,
  products,
}: {
  rows: StockMovementRow[];
  pageInfo: PageInfo;
  isFiltered: boolean;
  products: Array<{ id: string; name: string }>;
}) {
  const identity = (movement: StockMovementRow) => (
    <div className="min-w-0">
      <p className="flex items-center gap-2">
        <span className="truncate text-[13.5px] font-medium">{movement.productName}</span>
        <Badge variant={TONE[movement.type] ?? 'neutral'} size="sm">
          {humanizeEnum(movement.type)}
        </Badge>
      </p>
      <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
        {movement.reason ?? movement.reference ?? (movement.sku ?? '—')}
      </p>
    </div>
  );

  const columns: Array<DataTableColumn<StockMovementRow>> = [
    { id: 'product', header: 'Movement', sortable: true, cell: identity },
    {
      id: 'occurredAt',
      header: 'When',
      sortable: true,
      cell: (movement) => (
        <span className="text-[13px] text-muted-foreground">
          {formatDate(movement.occurredAt)}
        </span>
      ),
    },
    {
      id: 'quantity',
      header: 'Change',
      sortable: true,
      align: 'right',
      cell: (movement) => (
        <span
          className={
            movement.quantity >= 0
              ? 'text-[13px] font-semibold tabular text-success'
              : 'text-[13px] font-semibold tabular text-destructive'
          }
        >
          {movement.quantity >= 0 ? '+' : ''}
          {formatNumber(movement.quantity, 0)} {movement.unit}
        </span>
      ),
    },
    {
      id: 'balanceAfter',
      header: 'Balance after',
      hideBelow: 'md',
      align: 'right',
      cell: (movement) => (
        <span className="text-[13px] tabular text-muted-foreground">
          {formatNumber(movement.balanceAfter, 0)}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(movement) => movement.id}
      rowHref={(movement) => `/products/${movement.productId}`}
      pageInfo={pageInfo}
      isFiltered={isFiltered}
      searchPlaceholder="Search product, SKU, reason…"
      filters={[
        {
          key: 'type',
          label: 'Type',
          options: Object.keys(TONE).map((type) => ({
            value: type,
            label: humanizeEnum(type),
          })),
        },
        {
          key: 'productId',
          label: 'Product',
          options: products.map((product) => ({
            value: product.id,
            label: product.name,
          })),
        },
      ]}
      mobileRow={(movement) => (
        <div className="flex items-start justify-between gap-3">
          {identity(movement)}
          <div className="shrink-0 text-right">
            <p
              className={
                movement.quantity >= 0
                  ? 'text-[13px] font-semibold tabular text-success'
                  : 'text-[13px] font-semibold tabular text-destructive'
              }
            >
              {movement.quantity >= 0 ? '+' : ''}
              {formatNumber(movement.quantity, 0)}
            </p>
            <p className="text-[11.5px] text-muted-foreground">
              {formatDate(movement.occurredAt, 'dd MMM')}
            </p>
          </div>
        </div>
      )}
      empty={
        <EmptyState
          icon={PackageSearch}
          title="No stock movements yet"
          description="Every sale, purchase and manual correction lands here, so a surprising stock level can always be traced back."
          action={
            <Link href="/products" className="text-[13px] font-medium text-primary hover:underline">
              Adjust stock from a product
            </Link>
          }
        />
      }
    />
  );
}
