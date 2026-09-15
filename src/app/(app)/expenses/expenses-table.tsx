'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Pencil, TrendingDown, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/data-table/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { RowActions } from '@/components/shared/row-actions';
import { ConfirmDialog, useConfirm } from '@/components/shared/confirm-dialog';
import { deleteExpenseAction } from '@/server/actions/expenses';
import { formatCurrency } from '@/lib/money';
import { formatDate } from '@/lib/date';
import { humanizeEnum } from '@/lib/utils';
import type { PageInfo } from '@/lib/query';
import type { ExpenseListRow } from '@/server/services/expenses';

type Props = {
  rows: ExpenseListRow[];
  pageInfo: PageInfo;
  isFiltered: boolean;
  currency: string;
  categories: Array<{ id: string; name: string }>;
  suppliers: Array<{ id: string; name: string }>;
  can: { create: boolean; edit: boolean; delete: boolean };
};

const METHODS = [
  'CASH',
  'BANK_TRANSFER',
  'CARD',
  'CHECK',
  'MOBILE_MONEY',
  'ONLINE',
  'OTHER',
];

export function ExpensesTable({
  rows,
  pageInfo,
  isFiltered,
  currency,
  categories,
  suppliers,
  can,
}: Props) {
  const router = useRouter();
  const deleteConfirm = useConfirm<ExpenseListRow>();

  const identity = (expense: ExpenseListRow) => (
    <div className="min-w-0">
      <p className="flex items-center gap-2">
        <span className="truncate text-[13.5px] font-medium">{expense.title}</span>
        {expense.status !== 'APPROVED' ? (
          <StatusBadge status={expense.status} size="sm" />
        ) : null}
        {expense.billable ? (
          <Badge variant="info" size="sm">
            Rebillable
          </Badge>
        ) : null}
      </p>
      <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
        <span className="font-mono">{expense.number}</span>
        {expense.payee ? ` · ${expense.payee}` : ''}
      </p>
    </div>
  );

  const columns: Array<DataTableColumn<ExpenseListRow>> = [
    { id: 'title', header: 'Expense', sortable: true, cell: identity },
    {
      id: 'category',
      header: 'Category',
      hideBelow: 'md',
      cell: (expense) => (
        <span className="text-[13px] text-muted-foreground">
          {expense.categoryName ?? 'Uncategorised'}
        </span>
      ),
    },
    {
      id: 'spentAt',
      header: 'Date',
      sortable: true,
      cell: (expense) => (
        <span className="text-[13px] text-muted-foreground">
          {formatDate(expense.spentAt)}
        </span>
      ),
    },
    {
      id: 'method',
      header: 'Method',
      hideBelow: 'xl',
      optional: true,
      cell: (expense) => (
        <span className="text-[13px] text-muted-foreground">
          {humanizeEnum(expense.method)}
        </span>
      ),
    },
    {
      id: 'total',
      header: 'Amount',
      sortable: true,
      align: 'right',
      cell: (expense) => (
        <span className="text-[13px] font-semibold tabular">
          {formatCurrency(expense.total, { currency })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: (expense) => (
        <RowActions
          actions={[
            ...(can.edit
              ? [{ label: 'Edit', icon: Pencil, href: `/expenses/${expense.id}/edit` }]
              : []),
            ...(can.delete
              ? [
                  {
                    label: 'Delete',
                    icon: Trash2,
                    destructive: true,
                    separatorBefore: true,
                    onSelect: () => deleteConfirm.ask(expense),
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
        rowKey={(expense) => expense.id}
        rowHref={can.edit ? (expense) => `/expenses/${expense.id}/edit` : undefined}
        pageInfo={pageInfo}
        isFiltered={isFiltered}
        searchPlaceholder="Search description, payee, reference…"
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'DRAFT', label: 'Draft' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'APPROVED', label: 'Approved' },
              { value: 'REIMBURSED', label: 'Reimbursed' },
              { value: 'REJECTED', label: 'Rejected' },
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
          {
            key: 'supplierId',
            label: 'Supplier',
            options: suppliers.map((supplier) => ({
              value: supplier.id,
              label: supplier.name,
            })),
          },
          {
            key: 'method',
            label: 'Method',
            options: METHODS.map((method) => ({
              value: method,
              label: humanizeEnum(method),
            })),
          },
        ]}
        mobileRow={(expense) => (
          <div className="flex items-start justify-between gap-3">
            {identity(expense)}
            <div className="shrink-0 text-right">
              <p className="text-[13px] font-semibold tabular">
                {formatCurrency(expense.total, { currency })}
              </p>
              <p className="text-[11.5px] text-muted-foreground">
                {formatDate(expense.spentAt, 'dd MMM')}
              </p>
            </div>
          </div>
        )}
        empty={
          <EmptyState
            icon={TrendingDown}
            title="No expenses yet"
            description="Record what you spend and the dashboard can show profit rather than just revenue."
            action={
              can.create ? (
                <Button size="sm" asChild>
                  <Link href="/expenses/new">Record an expense</Link>
                </Button>
              ) : undefined
            }
          />
        }
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title="Delete this expense?"
        destructive
        confirmLabel="Delete expense"
        description={
          <>
            <strong className="text-foreground">{deleteConfirm.target?.number}</strong>,{' '}
            {deleteConfirm.target?.title}, will be removed and stop counting towards your
            spend. This cannot be undone.
          </>
        }
        onConfirm={async () => {
          if (!deleteConfirm.target) return;
          const result = await deleteExpenseAction(deleteConfirm.target.id);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success('Expense deleted');
          router.refresh();
        }}
      />
    </>
  );
}
