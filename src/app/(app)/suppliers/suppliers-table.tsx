'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Truck } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/data-table/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { RowActions } from '@/components/shared/row-actions';
import { ConfirmDialog, useConfirm } from '@/components/shared/confirm-dialog';
import { deleteSupplierAction } from '@/server/actions/suppliers';
import { formatCurrency } from '@/lib/money';
import type { PageInfo } from '@/lib/query';
import type { SupplierListRow } from '@/server/services/suppliers';

type Props = {
  rows: SupplierListRow[];
  pageInfo: PageInfo;
  isFiltered: boolean;
  currency: string;
  can: { create: boolean; edit: boolean; delete: boolean };
};

export function SuppliersTable({ rows, pageInfo, isFiltered, currency, can }: Props) {
  const router = useRouter();
  const deleteConfirm = useConfirm<SupplierListRow>();

  const identity = (supplier: SupplierListRow) => (
    <div className="min-w-0">
      <p className="flex items-center gap-2">
        <span className="truncate text-[13.5px] font-medium">
          {supplier.companyName ?? supplier.name}
        </span>
        {supplier.status !== 'ACTIVE' ? (
          <StatusBadge status={supplier.status} size="sm" />
        ) : null}
      </p>
      <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
        {supplier.companyName ? supplier.name : (supplier.email ?? '—')}
      </p>
    </div>
  );

  const columns: Array<DataTableColumn<SupplierListRow>> = [
    { id: 'name', header: 'Supplier', sortable: true, cell: identity },
    {
      id: 'city',
      header: 'Location',
      sortable: true,
      hideBelow: 'lg',
      optional: true,
      cell: (supplier) => (
        <span className="text-[13px] text-muted-foreground">{supplier.city ?? '—'}</span>
      ),
    },
    {
      id: 'terms',
      header: 'Terms',
      hideBelow: 'xl',
      optional: true,
      cell: (supplier) => (
        <span className="text-[13px] text-muted-foreground tabular">
          {supplier.paymentTermDays} days
        </span>
      ),
    },
    {
      id: 'bills',
      header: 'Bills',
      hideBelow: 'md',
      align: 'right',
      cell: (supplier) => (
        <span className="text-[13px] tabular">{supplier.billCount}</span>
      ),
    },
    {
      id: 'owed',
      header: 'You owe',
      align: 'right',
      cell: (supplier) => (
        <span
          className={
            supplier.owed > 0
              ? 'text-[13px] font-semibold tabular'
              : 'text-[13px] tabular text-muted-foreground'
          }
        >
          {formatCurrency(supplier.owed, { currency })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: (supplier) => (
        <RowActions
          actions={[
            ...(can.edit
              ? [
                  {
                    label: 'Edit',
                    icon: Pencil,
                    href: `/suppliers/${supplier.id}/edit`,
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
                    onSelect: () => deleteConfirm.ask(supplier),
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
        rowKey={(supplier) => supplier.id}
        rowHref={(supplier) => `/suppliers/${supplier.id}`}
        pageInfo={pageInfo}
        isFiltered={isFiltered}
        searchPlaceholder="Search name, company, email, city…"
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
              { value: 'BLOCKED', label: 'Blocked' },
            ],
          },
        ]}
        mobileRow={(supplier) => (
          <div className="flex items-start justify-between gap-3">
            {identity(supplier)}
            <div className="shrink-0 text-right">
              <p className="text-[13px] font-semibold tabular">
                {formatCurrency(supplier.owed, { currency })}
              </p>
              <p className="text-[11.5px] text-muted-foreground">owed</p>
            </div>
          </div>
        )}
        empty={
          <EmptyState
            icon={Truck}
            title="No suppliers yet"
            description="Add the businesses you buy from, and their orders, bills and balances collect here."
            action={
              can.create ? (
                <Button size="sm" asChild>
                  <Link href="/suppliers/new">Add a supplier</Link>
                </Button>
              ) : undefined
            }
          />
        }
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title="Remove this supplier?"
        destructive
        confirmLabel="Remove supplier"
        description={
          <>
            <strong className="text-foreground">
              {deleteConfirm.target?.companyName ?? deleteConfirm.target?.name}
            </strong>{' '}
            will be taken off your lists. Existing orders and bills keep their record of
            them, so your books stay intact.
          </>
        }
        onConfirm={async () => {
          if (!deleteConfirm.target) return;
          const result = await deleteSupplierAction(deleteConfirm.target.id);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success('Supplier removed');
          router.refresh();
        }}
      />
    </>
  );
}
