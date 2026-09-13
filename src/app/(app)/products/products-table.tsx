'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, Package, Pencil, PackagePlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/data-table/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { RowActions } from '@/components/shared/row-actions';
import { ConfirmDialog, useConfirm } from '@/components/shared/confirm-dialog';
import { deleteProductAction } from '@/server/actions/products';
import { formatCurrency, formatNumber } from '@/lib/money';
import type { PageInfo } from '@/lib/query';
import type { ProductListRow } from '@/server/services/products';

type Props = {
  rows: ProductListRow[];
  pageInfo: PageInfo;
  isFiltered: boolean;
  currency: string;
  categories: Array<{ id: string; name: string }>;
  can: { create: boolean; edit: boolean; delete: boolean; adjust: boolean };
};

export function ProductsTable({
  rows,
  pageInfo,
  isFiltered,
  currency,
  categories,
  can,
}: Props) {
  const router = useRouter();
  const confirm = useConfirm<ProductListRow>();

  async function remove(product: ProductListRow) {
    const result = await deleteProductAction(product.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`${product.name} removed`);
    router.refresh();
  }

  const identity = (product: ProductListRow) => (
    <div className="min-w-0">
      <p className="truncate text-[13.5px] font-medium">{product.name}</p>
      <p className="truncate font-mono text-[11.5px] text-muted-foreground">
        {product.sku}
        {product.categoryName ? ` · ${product.categoryName}` : ''}
      </p>
    </div>
  );

  const stockCell = (product: ProductListRow) => {
    if (!product.trackInventory) {
      return <span className="text-[13px] text-muted-foreground">Not tracked</span>;
    }
    return (
      <span className="inline-flex items-center gap-2">
        <span className="text-[13px] tabular">
          {formatNumber(product.stockQuantity, 0)} {product.unit}
        </span>
        {product.stockQuantity <= 0 ? (
          <Badge variant="destructive" size="sm">
            Out
          </Badge>
        ) : product.isLow ? (
          <Badge variant="warning" size="sm">
            Low
          </Badge>
        ) : null}
      </span>
    );
  };

  const columns: Array<DataTableColumn<ProductListRow>> = [
    { id: 'name', header: 'Product', sortable: true, cell: identity },
    {
      id: 'type',
      header: 'Type',
      hideBelow: 'xl',
      optional: true,
      cell: (product) => (
        <Badge variant="neutral" size="sm">
          {product.type === 'SERVICE' ? 'Service' : 'Good'}
        </Badge>
      ),
    },
    {
      id: 'purchasePrice',
      header: 'Cost',
      align: 'right',
      hideBelow: 'xl',
      optional: true,
      cell: (product) => (
        <span className="tabular text-muted-foreground">
          {formatCurrency(product.purchasePrice, { currency })}
        </span>
      ),
    },
    {
      id: 'sellingPrice',
      header: 'Price',
      sortable: true,
      align: 'right',
      cell: (product) => (
        <span className="font-medium tabular">
          {formatCurrency(product.sellingPrice, { currency })}
        </span>
      ),
    },
    {
      id: 'stockQuantity',
      header: 'Stock',
      sortable: true,
      hideBelow: 'md',
      cell: stockCell,
    },
    {
      id: 'status',
      header: 'Status',
      align: 'center',
      hideBelow: 'lg',
      cell: (product) => <StatusBadge status={product.status} size="sm" />,
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      width: '3.5rem',
      cell: (product) => (
        <RowActions
          label={`Actions for ${product.name}`}
          actions={[
            { label: 'View', icon: Eye, href: `/products/${product.id}` },
            ...(can.edit
              ? [{ label: 'Edit', icon: Pencil, href: `/products/${product.id}/edit` }]
              : []),
            ...(can.adjust && product.trackInventory
              ? [
                  {
                    label: 'Adjust stock',
                    icon: PackagePlus,
                    href: `/products/${product.id}?adjust=1`,
                  },
                ]
              : []),
            ...(can.delete
              ? [
                  {
                    label: 'Remove',
                    icon: Trash2,
                    destructive: true,
                    separatorBefore: true,
                    onSelect: () => confirm.ask(product),
                  },
                ]
              : []),
          ]}
        />
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(product) => product.id}
        rowHref={(product) => `/products/${product.id}`}
        pageInfo={pageInfo}
        isFiltered={isFiltered}
        searchPlaceholder="Search name, SKU, barcode…"
        filters={[
          {
            key: 'categoryId',
            label: 'Category',
            options: categories.map((category) => ({
              value: category.id,
              label: category.name,
            })),
          },
          {
            key: 'type',
            label: 'Type',
            options: [
              { value: 'GOOD', label: 'Goods' },
              { value: 'SERVICE', label: 'Services' },
            ],
          },
          {
            key: 'stock',
            label: 'Stock',
            allLabel: 'Any stock level',
            options: [
              { value: 'low', label: 'At or below minimum' },
              { value: 'out', label: 'Out of stock' },
            ],
          },
        ]}
        mobileRow={(product) => (
          <div className="flex items-start justify-between gap-3">
            {identity(product)}
            <div className="shrink-0 text-right">
              <p className="text-[13px] font-semibold tabular">
                {formatCurrency(product.sellingPrice, { currency })}
              </p>
              <p className="mt-0.5">{stockCell(product)}</p>
            </div>
          </div>
        )}
        empty={
          <EmptyState
            icon={Package}
            title="Your catalogue is empty"
            description="Add the goods and services you sell. Prices, tax and stock levels flow straight into quotes and invoices."
            action={
              can.create ? (
                <Button size="sm" asChild>
                  <Link href="/products/new">Add your first product</Link>
                </Button>
              ) : undefined
            }
          />
        }
      />

      <ConfirmDialog
        open={confirm.open}
        onOpenChange={confirm.onOpenChange}
        title="Remove this product?"
        destructive
        confirmLabel="Remove product"
        description={
          <>
            <strong className="text-foreground">{confirm.target?.name}</strong> will be
            taken out of the catalogue. Documents that already reference it keep their
            line items, and its stock history is preserved.
          </>
        }
        onConfirm={() => (confirm.target ? remove(confirm.target) : undefined)}
      />
    </>
  );
}
