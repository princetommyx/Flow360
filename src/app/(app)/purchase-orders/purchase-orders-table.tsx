'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, PackageCheck, Pencil, Send, ShoppingCart, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/data-table/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { RowActions } from '@/components/shared/row-actions';
import { ConfirmDialog, useConfirm } from '@/components/shared/confirm-dialog';
import {
  deletePurchaseOrderAction,
  setPurchaseOrderStatusAction,
} from '@/server/actions/purchase-orders';
import { formatCurrency } from '@/lib/money';
import { formatDate } from '@/lib/date';
import type { PageInfo } from '@/lib/query';
import type { PurchaseOrderListRow } from '@/server/services/purchase-orders';

type Props = {
  rows: PurchaseOrderListRow[];
  pageInfo: PageInfo;
  isFiltered: boolean;
  currency: string;
  suppliers: Array<{ id: string; label: string }>;
  can: { create: boolean; edit: boolean; delete: boolean; bill: boolean };
};

export function PurchaseOrdersTable({
  rows,
  pageInfo,
  isFiltered,
  currency,
  suppliers,
  can,
}: Props) {
  const router = useRouter();
  const deleteConfirm = useConfirm<PurchaseOrderListRow>();
  const cancelConfirm = useConfirm<PurchaseOrderListRow>();

  async function run(
    action: () => Promise<{ ok: boolean; error?: string }>,
    success: string,
  ) {
    const result = await action();
    if (!result.ok) {
      toast.error(result.error ?? 'That did not work.');
      return;
    }
    toast.success(success);
    router.refresh();
  }

  const identity = (order: PurchaseOrderListRow) => (
    <div className="min-w-0">
      <p className="flex items-center gap-2">
        <span className="font-mono text-[13px] font-medium">{order.number}</span>
        <StatusBadge status={order.status} size="sm" />
      </p>
      <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
        {order.supplierName}
      </p>
    </div>
  );

  const columns: Array<DataTableColumn<PurchaseOrderListRow>> = [
    { id: 'number', header: 'Order', sortable: true, cell: identity },
    {
      id: 'orderDate',
      header: 'Ordered',
      sortable: true,
      hideBelow: 'lg',
      optional: true,
      cell: (order) => (
        <span className="text-[13px] text-muted-foreground">
          {formatDate(order.orderDate)}
        </span>
      ),
    },
    {
      id: 'expectedDate',
      header: 'Expected',
      sortable: true,
      hideBelow: 'md',
      cell: (order) => {
        if (!order.expectedDate) {
          return <span className="text-[13px] text-muted-foreground">—</span>;
        }
        const late =
          order.expectedDate < new Date() &&
          ['SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED'].includes(order.status);
        return (
          <span
            className={
              late
                ? 'text-[13px] font-medium text-warning-foreground'
                : 'text-[13px] text-muted-foreground'
            }
          >
            {formatDate(order.expectedDate)}
          </span>
        );
      },
    },
    {
      id: 'received',
      header: 'Received',
      hideBelow: 'xl',
      optional: true,
      cell: (order) => (
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted" aria-hidden>
            <span
              className="block h-full rounded-full bg-primary"
              style={{ width: `${order.receivedPercent}%` }}
            />
          </span>
          <span className="text-[12.5px] tabular text-muted-foreground">
            {order.receivedPercent}%
          </span>
        </div>
      ),
    },
    {
      id: 'total',
      header: 'Total',
      sortable: true,
      align: 'right',
      cell: (order) => (
        <span className="text-[13px] font-semibold tabular">
          {formatCurrency(order.total, { currency })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: (order) => (
        <RowActions
          actions={[
            ...(can.edit && ['DRAFT', 'SENT'].includes(order.status)
              ? [
                  {
                    label: 'Edit',
                    icon: Pencil,
                    href: `/purchase-orders/${order.id}/edit`,
                  },
                ]
              : []),
            ...(can.edit && order.status === 'DRAFT'
              ? [
                  {
                    label: 'Mark sent',
                    icon: Send,
                    onSelect: () =>
                      run(
                        () => setPurchaseOrderStatusAction(order.id, 'SENT'),
                        `${order.number} marked sent`,
                      ),
                  },
                ]
              : []),
            ...(can.edit && order.status === 'SENT'
              ? [
                  {
                    label: 'Mark confirmed',
                    icon: Check,
                    onSelect: () =>
                      run(
                        () => setPurchaseOrderStatusAction(order.id, 'CONFIRMED'),
                        `${order.number} confirmed`,
                      ),
                  },
                ]
              : []),
            ...(can.edit &&
            ['SENT', 'CONFIRMED', 'PARTIALLY_RECEIVED'].includes(order.status)
              ? [
                  {
                    label: 'Receive goods',
                    icon: PackageCheck,
                    href: `/purchase-orders/${order.id}#receive`,
                  },
                ]
              : []),
            ...(can.bill && ['RECEIVED', 'PARTIALLY_RECEIVED'].includes(order.status) && !order.billed
              ? [
                  {
                    label: 'Create bill',
                    icon: ShoppingCart,
                    separatorBefore: true,
                    href: `/bills/new?purchaseOrderId=${order.id}`,
                  },
                ]
              : []),
            ...(can.edit &&
            !['RECEIVED', 'BILLED', 'CANCELLED'].includes(order.status)
              ? [
                  {
                    label: 'Cancel order',
                    icon: X,
                    separatorBefore: true,
                    onSelect: () => cancelConfirm.ask(order),
                  },
                ]
              : []),
            ...(can.delete && !order.billed && ['DRAFT', 'SENT', 'CANCELLED'].includes(order.status)
              ? [
                  {
                    label: 'Delete',
                    icon: Trash2,
                    destructive: true,
                    onSelect: () => deleteConfirm.ask(order),
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
        rowKey={(order) => order.id}
        rowHref={(order) => `/purchase-orders/${order.id}`}
        pageInfo={pageInfo}
        isFiltered={isFiltered}
        searchPlaceholder="Search number or supplier…"
        filters={[
          {
            key: 'status',
            label: 'Status',
            allLabel: 'All orders',
            options: [
              { value: 'open', label: 'Still expected' },
              { value: 'DRAFT', label: 'Draft' },
              { value: 'SENT', label: 'Sent' },
              { value: 'CONFIRMED', label: 'Confirmed' },
              { value: 'PARTIALLY_RECEIVED', label: 'Partially received' },
              { value: 'RECEIVED', label: 'Received' },
              { value: 'BILLED', label: 'Billed' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ],
          },
          {
            key: 'supplierId',
            label: 'Supplier',
            options: suppliers.map((supplier) => ({
              value: supplier.id,
              label: supplier.label,
            })),
          },
        ]}
        mobileRow={(order) => (
          <div className="flex items-start justify-between gap-3">
            {identity(order)}
            <div className="shrink-0 text-right">
              <p className="text-[13px] font-semibold tabular">
                {formatCurrency(order.total, { currency })}
              </p>
              <p className="text-[11.5px] text-muted-foreground">
                {order.receivedPercent}% received
              </p>
            </div>
          </div>
        )}
        empty={
          <EmptyState
            icon={ShoppingCart}
            title="No purchase orders yet"
            description="Raise an order here and stock arrives against it — the quantities you receive post straight to inventory."
            action={
              can.create ? (
                <Button size="sm" asChild>
                  <Link href="/purchase-orders/new">Create a purchase order</Link>
                </Button>
              ) : undefined
            }
          />
        }
      />

      <ConfirmDialog
        open={cancelConfirm.open}
        onOpenChange={cancelConfirm.onOpenChange}
        title="Cancel this order?"
        confirmLabel="Cancel the order"
        description={
          <>
            <strong className="text-foreground">{cancelConfirm.target?.number}</strong>{' '}
            will stop counting towards what you expect to arrive. Stock already
            received against it stays where it is.
          </>
        }
        onConfirm={() =>
          cancelConfirm.target
            ? run(
                () => setPurchaseOrderStatusAction(cancelConfirm.target!.id, 'CANCELLED'),
                'Order cancelled',
              )
            : undefined
        }
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title="Delete this order?"
        destructive
        confirmLabel="Delete order"
        description={
          <>
            <strong className="text-foreground">{deleteConfirm.target?.number}</strong>{' '}
            will be removed from your lists. This cannot be undone.
          </>
        }
        onConfirm={() =>
          deleteConfirm.target
            ? run(
                () => deletePurchaseOrderAction(deleteConfirm.target!.id),
                'Purchase order deleted',
              )
            : undefined
        }
      />
    </>
  );
}
