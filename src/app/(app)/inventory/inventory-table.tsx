'use client';

import Link from 'next/link';
import { Boxes } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { DataTable, type DataTableColumn } from '@/components/data-table/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { formatCurrency, formatNumber } from '@/lib/money';
import type { PageInfo } from '@/lib/query';
import type { StockLevelRow } from '@/server/services/inventory';

export function InventoryTable({
  rows,
  pageInfo,
  isFiltered,
  currency,
  categories,
}: {
  rows: StockLevelRow[];
  pageInfo: PageInfo;
  isFiltered: boolean;
  currency: string;
  categories: Array<{ id: string; name: string }>;
}) {
  const identity = (product: StockLevelRow) => (
    <div className="min-w-0">
      <p className="flex items-center gap-2">
        <span className="truncate text-[13.5px] font-medium">{product.name}</span>
        {product.stockQuantity <= 0 ? (
          <Badge variant="destructive" size="sm">
            Out
          </Badge>
        ) : product.needsReorder ? (
          <Badge variant="warning" size="sm">
            Reorder
          </Badge>
        ) : null}
      </p>
      <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
        {product.sku ? <span className="font-mono">{product.sku}</span> : '—'}
        {product.categoryName ? ` · ${product.categoryName}` : ''}
      </p>
    </div>
  );

  const columns: Array<DataTableColumn<StockLevelRow>> = [
    { id: 'name', header: 'Product', sortable: true, cell: identity },
    {
      id: 'stockQuantity',
      header: 'On hand',
      sortable: true,
      align: 'right',
      cell: (product) => (
        <span
          className={
            product.stockQuantity <= 0
              ? 'text-[13px] font-semibold tabular text-destructive'
              : product.needsReorder
                ? 'text-[13px] font-semibold tabular text-warning-foreground'
                : 'text-[13px] font-semibold tabular'
          }
        >
          {formatNumber(product.stockQuantity, 0)} {product.unit}
        </span>
      ),
    },
    {
      id: 'minStockLevel',
      header: 'Reorder at',
      sortable: true,
      hideBelow: 'md',
      align: 'right',
      cell: (product) => (
        <span className="text-[13px] tabular text-muted-foreground">
          {formatNumber(product.reorderLevel, 0)}
        </span>
      ),
    },
    {
      id: 'cost',
      header: 'Unit cost',
      hideBelow: 'lg',
      optional: true,
      align: 'right',
      cell: (product) => (
        <span className="text-[13px] tabular text-muted-foreground">
          {formatCurrency(product.costPrice, { currency })}
        </span>
      ),
    },
    {
      id: 'value',
      header: 'Stock value',
      align: 'right',
      cell: (product) => (
        <span className="text-[13px] font-semibold tabular">
          {formatCurrency(product.stockValue, { currency })}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      rowKey={(product) => product.id}
      rowHref={(product) => `/products/${product.id}`}
      pageInfo={pageInfo}
      isFiltered={isFiltered}
      searchPlaceholder="Search product or SKU…"
      filters={[
        {
          key: 'level',
          label: 'Level',
          allLabel: 'All stock',
          options: [
            { value: 'reorder', label: 'At or below reorder' },
            { value: 'out', label: 'Out of stock' },
          ],
        },
        {
          key: 'categoryId',
          label: 'Category',
          options: categories.map((category) => ({
            value: category.id,
            label: category.name,
          })),
        },
      ]}
      mobileRow={(product) => (
        <div className="flex items-start justify-between gap-3">
          {identity(product)}
          <div className="shrink-0 text-right">
            <p className="text-[13px] font-semibold tabular">
              {formatNumber(product.stockQuantity, 0)} {product.unit}
            </p>
            <p className="text-[11.5px] text-muted-foreground tabular">
              {formatCurrency(product.stockValue, { currency })}
            </p>
          </div>
        </div>
      )}
      empty={
        <EmptyState
          icon={Boxes}
          title="Nothing tracked yet"
          description="Products with stock tracking switched on appear here, with what is on hand and what it is worth."
          action={
            <Link href="/products" className="text-[13px] font-medium text-primary hover:underline">
              Go to products
            </Link>
          }
        />
      }
    />
  );
}
