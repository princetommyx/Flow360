'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Pencil, Trash2, Wallet, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/data-table/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { RowActions } from '@/components/shared/row-actions';
import { ConfirmDialog, useConfirm } from '@/components/shared/confirm-dialog';
import {
  approvePayrollAction,
  cancelPayrollAction,
  deletePayrollAction,
} from '@/server/actions/payroll';
import { formatCurrency } from '@/lib/money';
import { formatDate } from '@/lib/date';
import type { PageInfo } from '@/lib/query';
import type { PayrollListRow } from '@/server/services/payroll';

export function PayrollTable({
  rows,
  pageInfo,
  isFiltered,
  currency,
  employees,
  can,
}: {
  rows: PayrollListRow[];
  pageInfo: PageInfo;
  isFiltered: boolean;
  currency: string;
  employees: Array<{ id: string; name: string }>;
  can: { create: boolean; edit: boolean; delete: boolean };
}) {
  const router = useRouter();
  const deleteConfirm = useConfirm<PayrollListRow>();
  const cancelConfirm = useConfirm<PayrollListRow>();

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

  const identity = (payroll: PayrollListRow) => (
    <div className="min-w-0">
      <p className="flex items-center gap-2">
        <span className="truncate text-[13.5px] font-medium">
          {payroll.employeeName}
        </span>
        <StatusBadge status={payroll.status} size="sm" />
      </p>
      <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
        {payroll.number} · {formatDate(payroll.periodStart, 'dd MMM')} to{' '}
        {formatDate(payroll.periodEnd, 'dd MMM yyyy')}
      </p>
    </div>
  );

  const columns: Array<DataTableColumn<PayrollListRow>> = [
    { id: 'number', header: 'Payslip', sortable: true, cell: identity },
    {
      id: 'gross',
      header: 'Gross',
      hideBelow: 'lg',
      optional: true,
      align: 'right',
      cell: (payroll) => (
        <span className="text-[13px] tabular text-muted-foreground">
          {formatCurrency(payroll.gross, { currency })}
        </span>
      ),
    },
    {
      id: 'deductions',
      header: 'Deductions',
      hideBelow: 'xl',
      optional: true,
      align: 'right',
      cell: (payroll) => (
        <span className="text-[13px] tabular text-muted-foreground">
          {payroll.deductions > 0 ? '− ' : ''}
          {formatCurrency(payroll.deductions, { currency })}
        </span>
      ),
    },
    {
      id: 'paidAt',
      header: 'Paid',
      hideBelow: 'md',
      cell: (payroll) => (
        <span className="text-[13px] text-muted-foreground">
          {payroll.paidAt ? formatDate(payroll.paidAt) : '—'}
        </span>
      ),
    },
    {
      id: 'netSalary',
      header: 'Take-home',
      sortable: true,
      align: 'right',
      cell: (payroll) => (
        <span className="text-[13px] font-semibold tabular">
          {formatCurrency(payroll.netSalary, { currency })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: (payroll) => (
        <RowActions
          actions={[
            ...(can.edit && payroll.status === 'DRAFT'
              ? [
                  { label: 'Edit', icon: Pencil, href: `/payroll/${payroll.id}/edit` },
                  {
                    label: 'Approve',
                    icon: Check,
                    onSelect: () =>
                      run(
                        () => approvePayrollAction(payroll.id),
                        `${payroll.number} approved`,
                      ),
                  },
                ]
              : []),
            ...(can.edit && payroll.status === 'APPROVED'
              ? [
                  {
                    label: 'Pay this payslip',
                    icon: Wallet,
                    href: `/payroll/${payroll.id}#pay`,
                  },
                ]
              : []),
            ...(can.edit && ['DRAFT', 'APPROVED'].includes(payroll.status)
              ? [
                  {
                    label: 'Cancel',
                    icon: X,
                    separatorBefore: true,
                    onSelect: () => cancelConfirm.ask(payroll),
                  },
                ]
              : []),
            ...(can.delete && payroll.status !== 'PAID'
              ? [
                  {
                    label: 'Delete',
                    icon: Trash2,
                    destructive: true,
                    onSelect: () => deleteConfirm.ask(payroll),
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
        rowKey={(payroll) => payroll.id}
        rowHref={(payroll) => `/payroll/${payroll.id}`}
        pageInfo={pageInfo}
        isFiltered={isFiltered}
        searchPlaceholder="Search name or payslip number…"
        filters={[
          {
            key: 'status',
            label: 'Status',
            allLabel: 'All payslips',
            options: [
              { value: 'unpaid', label: 'Not yet paid' },
              { value: 'DRAFT', label: 'Draft' },
              { value: 'APPROVED', label: 'Approved' },
              { value: 'PAID', label: 'Paid' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ],
          },
          {
            key: 'employeeId',
            label: 'Employee',
            allLabel: 'Everyone',
            options: employees.map((employee) => ({
              value: employee.id,
              label: employee.name,
            })),
          },
        ]}
        mobileRow={(payroll) => (
          <div className="flex items-start justify-between gap-3">
            {identity(payroll)}
            <span className="shrink-0 text-[13px] font-semibold tabular">
              {formatCurrency(payroll.netSalary, { currency })}
            </span>
          </div>
        )}
        empty={
          <EmptyState
            icon={Wallet}
            title="No payslips yet"
            description="Prepare a payslip for someone on the team. Approving it queues the payment; paying it moves the money and writes the ledger entry."
            action={
              can.create ? (
                <Button size="sm" asChild>
                  <Link href="/payroll/new">Prepare a payslip</Link>
                </Button>
              ) : undefined
            }
          />
        }
      />

      <ConfirmDialog
        open={cancelConfirm.open}
        onOpenChange={cancelConfirm.onOpenChange}
        title="Cancel this payslip?"
        confirmLabel="Cancel the payslip"
        description={
          <>
            <strong className="text-foreground">{cancelConfirm.target?.number}</strong>{' '}
            will stop counting towards what you owe in wages. It stays on the list as a
            record.
          </>
        }
        onConfirm={() =>
          cancelConfirm.target
            ? run(
                () => cancelPayrollAction(cancelConfirm.target!.id),
                'Payslip cancelled',
              )
            : undefined
        }
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title="Delete this payslip?"
        destructive
        confirmLabel="Delete payslip"
        description={
          <>
            <strong className="text-foreground">{deleteConfirm.target?.number}</strong>{' '}
            will be removed. This cannot be undone.
          </>
        }
        onConfirm={() =>
          deleteConfirm.target
            ? run(
                () => deletePayrollAction(deleteConfirm.target!.id),
                'Payslip deleted',
              )
            : undefined
        }
      />
    </>
  );
}
