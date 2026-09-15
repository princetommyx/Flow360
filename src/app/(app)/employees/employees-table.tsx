'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, UserRound, Wallet } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/data-table/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { RowActions } from '@/components/shared/row-actions';
import { ConfirmDialog, useConfirm } from '@/components/shared/confirm-dialog';
import { deleteEmployeeAction } from '@/server/actions/employees';
import { formatCurrency } from '@/lib/money';
import { formatDate } from '@/lib/date';
import type { PageInfo } from '@/lib/query';
import type { EmployeeListRow } from '@/server/services/employees';

const TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full time',
  PART_TIME: 'Part time',
  CONTRACT: 'Contract',
  INTERN: 'Intern',
};

export function EmployeesTable({
  rows,
  pageInfo,
  isFiltered,
  currency,
  departments,
  can,
}: {
  rows: EmployeeListRow[];
  pageInfo: PageInfo;
  isFiltered: boolean;
  currency: string;
  departments: string[];
  can: { create: boolean; edit: boolean; delete: boolean; payroll: boolean };
}) {
  const router = useRouter();
  const deleteConfirm = useConfirm<EmployeeListRow>();

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

  const identity = (employee: EmployeeListRow) => (
    <div className="min-w-0">
      <p className="flex items-center gap-2">
        <span className="truncate text-[13.5px] font-medium">{employee.name}</span>
        <StatusBadge status={employee.status} size="sm" />
      </p>
      <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
        {employee.position ?? 'No role recorded'}
        {employee.department ? ` · ${employee.department}` : ''}
      </p>
    </div>
  );

  const columns: Array<DataTableColumn<EmployeeListRow>> = [
    { id: 'name', header: 'Person', sortable: true, cell: identity },
    {
      id: 'employeeNumber',
      header: 'Number',
      sortable: true,
      hideBelow: 'xl',
      optional: true,
      cell: (employee) => (
        <span className="font-mono text-[12.5px] text-muted-foreground">
          {employee.employeeNumber}
        </span>
      ),
    },
    {
      id: 'employmentType',
      header: 'Type',
      hideBelow: 'lg',
      optional: true,
      cell: (employee) => (
        <span className="text-[13px] text-muted-foreground">
          {TYPE_LABELS[employee.employmentType] ?? employee.employmentType}
        </span>
      ),
    },
    {
      id: 'hiredAt',
      header: 'Started',
      sortable: true,
      hideBelow: 'md',
      cell: (employee) => (
        <span className="text-[13px] text-muted-foreground">
          {formatDate(employee.hiredAt)}
        </span>
      ),
    },
    {
      id: 'baseSalary',
      header: 'Base pay',
      sortable: true,
      align: 'right',
      cell: (employee) => (
        <span className="text-[13px] font-semibold tabular">
          {formatCurrency(employee.baseSalary, { currency })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: (employee) => (
        <RowActions
          actions={[
            ...(can.edit
              ? [{ label: 'Edit', icon: Pencil, href: `/employees/${employee.id}/edit` }]
              : []),
            ...(can.payroll
              ? [
                  {
                    label: 'Run a payslip',
                    icon: Wallet,
                    href: `/payroll/new?employeeId=${employee.id}`,
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
                    onSelect: () => deleteConfirm.ask(employee),
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
        rowKey={(employee) => employee.id}
        rowHref={(employee) => `/employees/${employee.id}`}
        pageInfo={pageInfo}
        isFiltered={isFiltered}
        searchPlaceholder="Search name, role or number…"
        filters={[
          {
            key: 'status',
            label: 'Status',
            allLabel: 'Everyone',
            options: [
              { value: 'current', label: 'Still with you' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'PROBATION', label: 'On probation' },
              { value: 'ON_LEAVE', label: 'On leave' },
              { value: 'TERMINATED', label: 'Left' },
            ],
          },
          {
            key: 'employmentType',
            label: 'Type',
            allLabel: 'Any type',
            options: Object.entries(TYPE_LABELS).map(([value, label]) => ({
              value,
              label,
            })),
          },
          ...(departments.length > 0
            ? [
                {
                  key: 'department',
                  label: 'Department',
                  allLabel: 'All departments',
                  options: departments.map((department) => ({
                    value: department,
                    label: department,
                  })),
                },
              ]
            : []),
        ]}
        mobileRow={(employee) => (
          <div className="flex items-start justify-between gap-3">
            {identity(employee)}
            <div className="shrink-0 text-right">
              <p className="text-[13px] font-semibold tabular">
                {formatCurrency(employee.baseSalary, { currency })}
              </p>
              <p className="text-[11.5px] text-muted-foreground">
                since {formatDate(employee.hiredAt, 'MMM yyyy')}
              </p>
            </div>
          </div>
        )}
        empty={
          <EmptyState
            icon={UserRound}
            title="No one on the team yet"
            description="Add the people you employ here, and their payslips, attendance and timesheets all hang off these records."
            action={
              can.create ? (
                <Button size="sm" asChild>
                  <Link href="/employees/new">Add someone</Link>
                </Button>
              ) : undefined
            }
          />
        }
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title="Remove this person?"
        destructive
        confirmLabel="Remove"
        description={
          <>
            <strong className="text-foreground">{deleteConfirm.target?.name}</strong> will
            be removed from your team list. If they have already been paid, mark them as
            having left instead so their payslips stay reachable.
          </>
        }
        onConfirm={() =>
          deleteConfirm.target
            ? run(
                () => deleteEmployeeAction(deleteConfirm.target!.id),
                'Removed from the team',
              )
            : undefined
        }
      />
    </>
  );
}
