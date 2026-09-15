'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, FileText, Pencil, Trash2, Wallet, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/data-table/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { RowActions } from '@/components/shared/row-actions';
import { ConfirmDialog, useConfirm } from '@/components/shared/confirm-dialog';
import {
  approveBillAction,
  cancelBillAction,
  deleteBillAction,
} from '@/server/actions/bills';
import { formatCurrency } from '@/lib/money';
import { formatDate } from '@/lib/date';
import type { PageInfo } from '@/lib/query';
import type { BillListRow } from '@/server/services/bills';

type Props = {
  rows: BillListRow[];
  pageInfo: PageInfo;
  isFiltered: boolean;
  currency: string;
  suppliers: Array<{ id: string; label: string }>;
  can: { create: boolean; edit: boolean; delete: boolean; pay: boolean };
};

export function BillsTable({
  rows,
  pageInfo,
  isFiltered,
  currency,
  suppliers,
  can,
}: Props) {
  const router = useRouter();
  const deleteConfirm = useConfirm<BillListRow>();
  const cancelConfirm = useConfirm<BillListRow>();

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

  const identity = (bill: BillListRow) => (
    <div className="min-w-0">
      <p className="flex items-center gap-2">
        <span className="font-mono text-[13px] font-medium">{bill.number}</span>
        <StatusBadge status={bill.status} size="sm" />
      </p>
      <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
        {bill.supplierName}
        {bill.supplierRef ? ` · ref ${bill.supplierRef}` : ''}
      </p>
    </div>
  );

  const columns: Array<DataTableColumn<BillListRow>> = [
    { id: 'number', header: 'Bill', sortable: true, cell: identity },
    {
      id: 'issueDate',
      header: 'Issued',
      sortable: true,
      hideBelow: 'lg',
      optional: true,
      cell: (bill) => (
        <span className="text-[13px] text-muted-foreground">
          {formatDate(bill.issueDate)}
        </span>
      ),
    },
    {
      id: 'dueDate',
      header: 'Due',
      sortable: true,
      hideBelow: 'md',
      cell: (bill) => (
        <span
          className={
            bill.isOverdue
              ? 'text-[13px] font-medium text-destructive'
              : 'text-[13px] text-muted-foreground'
          }
        >
          {formatDate(bill.dueDate)}
        </span>
      ),
    },
    {
      id: 'purchaseOrder',
      header: 'Order',
      hideBelow: 'xl',
      optional: true,
      cell: (bill) =>
        bill.purchaseOrderNumber ? (
          <span className="font-mono text-[12.5px] text-muted-foreground">
            {bill.purchaseOrderNumber}
          </span>
        ) : (
          <span className="text-[13px] text-muted-foreground">—</span>
        ),
    },
    {
      id: 'balanceDue',
      header: 'Outstanding',
      sortable: true,
      align: 'right',
      cell: (bill) => (
        <div className="text-right">
          <p className="text-[13px] font-semibold tabular">
            {formatCurrency(bill.balanceDue, { currency })}
          </p>
          {bill.balanceDue !== bill.total ? (
            <p className="text-[11.5px] text-muted-foreground tabular">
              of {formatCurrency(bill.total, { currency })}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: (bill) => (
        <RowActions
          actions={[
            ...(can.edit && bill.status === 'DRAFT'
              ? [
                  { label: 'Edit', icon: Pencil, href: `/bills/${bill.id}/edit` },
                  {
                    label: 'Approve for payment',
                    icon: Check,
                    onSelect: () =>
                      run(() => approveBillAction(bill.id), `${bill.number} approved`),
                  },
                ]
              : []),
            ...(can.pay &&
            ['AWAITING_PAYMENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(bill.status)
              ? [
                  {
                    label: 'Record payment',
                    icon: Wallet,
                    href: `/bills/${bill.id}#pay`,
                  },
                ]
              : []),
            ...(can.edit && bill.status !== 'CANCELLED' && bill.balanceDue === bill.total
              ? [
                  {
                    label: 'Cancel bill',
                    icon: X,
                    separatorBefore: true,
                    onSelect: () => cancelConfirm.ask(bill),
                  },
                ]
              : []),
            ...(can.delete && bill.balanceDue === bill.total
              ? [
                  {
                    label: 'Delete',
                    icon: Trash2,
                    destructive: true,
                    onSelect: () => deleteConfirm.ask(bill),
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
        rowKey={(bill) => bill.id}
        rowHref={(bill) => `/bills/${bill.id}`}
        pageInfo={pageInfo}
        isFiltered={isFiltered}
        searchPlaceholder="Search number, reference or supplier…"
        filters={[
          {
            key: 'status',
            label: 'Status',
            allLabel: 'All bills',
            options: [
              { value: 'outstanding', label: 'Still owed' },
              { value: 'DRAFT', label: 'Draft' },
              { value: 'AWAITING_PAYMENT', label: 'Awaiting payment' },
              { value: 'PARTIALLY_PAID', label: 'Partly paid' },
              { value: 'OVERDUE', label: 'Overdue' },
              { value: 'PAID', label: 'Paid' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ],
          },
          {
            key: 'range',
            label: 'Show',
            allLabel: 'Any date',
            options: [{ value: 'overdue', label: 'Past their due date' }],
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
        mobileRow={(bill) => (
          <div className="flex items-start justify-between gap-3">
            {identity(bill)}
            <div className="shrink-0 text-right">
              <p className="text-[13px] font-semibold tabular">
                {formatCurrency(bill.balanceDue, { currency })}
              </p>
              <p
                className={
                  bill.isOverdue
                    ? 'text-[11.5px] font-medium text-destructive'
                    : 'text-[11.5px] text-muted-foreground'
                }
              >
                due {formatDate(bill.dueDate, 'dd MMM')}
              </p>
            </div>
          </div>
        )}
        empty={
          <EmptyState
            icon={FileText}
            title="No bills yet"
            description="Record what your suppliers invoice you here. Approve a bill and it starts counting towards what you owe."
            action={
              can.create ? (
                <Button size="sm" asChild>
                  <Link href="/bills/new">Record a bill</Link>
                </Button>
              ) : undefined
            }
          />
        }
      />

      <ConfirmDialog
        open={cancelConfirm.open}
        onOpenChange={cancelConfirm.onOpenChange}
        title="Cancel this bill?"
        confirmLabel="Cancel the bill"
        description={
          <>
            <strong className="text-foreground">{cancelConfirm.target?.number}</strong>{' '}
            will stop counting towards what you owe. It stays on the list as a record.
          </>
        }
        onConfirm={() =>
          cancelConfirm.target
            ? run(() => cancelBillAction(cancelConfirm.target!.id), 'Bill cancelled')
            : undefined
        }
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title="Delete this bill?"
        destructive
        confirmLabel="Delete bill"
        description={
          <>
            <strong className="text-foreground">{deleteConfirm.target?.number}</strong>{' '}
            will be removed from your lists. This cannot be undone.
          </>
        }
        onConfirm={() =>
          deleteConfirm.target
            ? run(() => deleteBillAction(deleteConfirm.target!.id), 'Bill deleted')
            : undefined
        }
      />
    </>
  );
}
