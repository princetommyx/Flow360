'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftRight, ArrowDownLeft, ArrowUpRight, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/data-table/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { RowActions } from '@/components/shared/row-actions';
import { ConfirmDialog, useConfirm } from '@/components/shared/confirm-dialog';
import { deleteTransactionAction } from '@/server/actions/transactions';
import { formatCurrency } from '@/lib/money';
import { formatDate, toDateInput } from '@/lib/date';
import type { PageInfo } from '@/lib/query';
import type { TransactionListRow } from '@/server/services/transactions';

import { TransactionDialog, type AccountChoice } from './transaction-dialog';

const TYPE_ICON = {
  INCOME: ArrowDownLeft,
  EXPENSE: ArrowUpRight,
  TRANSFER: ArrowLeftRight,
} as const;

export function TransactionsTable({
  rows,
  pageInfo,
  isFiltered,
  currency,
  accounts,
  can,
}: {
  rows: TransactionListRow[];
  pageInfo: PageInfo;
  isFiltered: boolean;
  currency: string;
  accounts: AccountChoice[];
  can: { create: boolean; edit: boolean; delete: boolean };
}) {
  const router = useRouter();
  const deleteConfirm = useConfirm<TransactionListRow>();
  const [editing, setEditing] = React.useState<TransactionListRow | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);

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

  const identity = (row: TransactionListRow) => {
    const Icon = TYPE_ICON[row.type as keyof typeof TYPE_ICON] ?? ArrowLeftRight;
    return (
      <div className="flex min-w-0 items-start gap-2.5">
        <span
          className={
            row.type === 'INCOME'
              ? 'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success'
              : row.type === 'EXPENSE'
                ? 'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-destructive-soft text-destructive'
                : 'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground'
          }
          aria-hidden
        >
          <Icon className="size-3.5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13.5px] font-medium">{row.description}</p>
          <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
            {row.accountName}
            {row.toAccountName ? ` → ${row.toAccountName}` : ''}
            {row.category ? ` · ${row.category}` : ''}
          </p>
        </div>
      </div>
    );
  };

  const columns: Array<DataTableColumn<TransactionListRow>> = [
    { id: 'description', header: 'Movement', sortable: true, cell: identity },
    {
      id: 'occurredAt',
      header: 'Date',
      sortable: true,
      hideBelow: 'md',
      cell: (row) => (
        <span className="text-[13px] text-muted-foreground">
          {formatDate(row.occurredAt)}
        </span>
      ),
    },
    {
      id: 'source',
      header: 'From',
      hideBelow: 'xl',
      optional: true,
      cell: (row) =>
        row.sourceHref && row.sourceLabel ? (
          <Link
            href={row.sourceHref}
            onClick={(event) => event.stopPropagation()}
            className="font-mono text-[12.5px] text-primary hover:underline"
          >
            {row.sourceLabel}
          </Link>
        ) : (
          <span className="text-[13px] text-muted-foreground">
            {row.reference ?? 'Entered by hand'}
          </span>
        ),
    },
    {
      id: 'amount',
      header: 'Amount',
      sortable: true,
      align: 'right',
      cell: (row) => (
        <span
          className={
            row.amount > 0
              ? 'text-[13px] font-semibold tabular text-success'
              : 'text-[13px] font-semibold tabular'
          }
        >
          {row.amount > 0 ? '+' : ''}
          {formatCurrency(row.amount, { currency })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: (row) => (
        <RowActions
          actions={[
            ...(can.edit && row.isManual
              ? [
                  {
                    label: 'Edit',
                    icon: Pencil,
                    onSelect: () => {
                      setEditing(row);
                      setDialogOpen(true);
                    },
                  },
                ]
              : []),
            ...(can.delete && row.isManual
              ? [
                  {
                    label: 'Delete',
                    icon: Trash2,
                    destructive: true,
                    onSelect: () => deleteConfirm.ask(row),
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
        rowKey={(row) => row.id}
        pageInfo={pageInfo}
        isFiltered={isFiltered}
        searchPlaceholder="Search description, reference or category…"
        toolbarActions={
          can.create ? (
            <Button
              size="sm"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus /> Record a movement
            </Button>
          ) : undefined
        }
        filters={[
          {
            key: 'type',
            label: 'Kind',
            allLabel: 'Everything',
            options: [
              { value: 'INCOME', label: 'Money in' },
              { value: 'EXPENSE', label: 'Money out' },
              { value: 'TRANSFER', label: 'Transfers' },
            ],
          },
          {
            key: 'accountId',
            label: 'Account',
            allLabel: 'All accounts',
            options: accounts.map((account) => ({
              value: account.id,
              label: account.name,
            })),
          },
        ]}
        mobileRow={(row) => (
          <div className="flex items-start justify-between gap-3">
            {identity(row)}
            <div className="shrink-0 text-right">
              <p
                className={
                  row.amount > 0
                    ? 'text-[13px] font-semibold tabular text-success'
                    : 'text-[13px] font-semibold tabular'
                }
              >
                {row.amount > 0 ? '+' : ''}
                {formatCurrency(row.amount, { currency })}
              </p>
              <p className="text-[11.5px] text-muted-foreground">
                {formatDate(row.occurredAt, 'dd MMM')}
              </p>
            </div>
          </div>
        )}
        empty={
          <EmptyState
            icon={ArrowLeftRight}
            title="Nothing in the ledger yet"
            description="Every payment, bill and expense writes a line here. You can also record takings, charges and transfers by hand."
            action={
              can.create ? (
                <Button
                  size="sm"
                  onClick={() => {
                    setEditing(null);
                    setDialogOpen(true);
                  }}
                >
                  Record a movement
                </Button>
              ) : undefined
            }
          />
        }
      />

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        accounts={accounts}
        transactionId={editing?.id}
        defaultValues={
          editing
            ? {
                type: editing.type as 'INCOME' | 'EXPENSE' | 'TRANSFER',
                accountId:
                  accounts.find((account) => account.name === editing.accountName)?.id ??
                  accounts[0]?.id ??
                  '',
                toAccountId:
                  accounts.find((account) => account.name === editing.toAccountName)?.id ??
                  null,
                amount: Math.abs(editing.amount),
                description: editing.description,
                category: editing.category ?? '',
                occurredAt: toDateInput(editing.occurredAt),
                reference: editing.reference ?? '',
              }
            : undefined
        }
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title="Delete this entry?"
        destructive
        confirmLabel="Delete entry"
        description={
          <>
            <strong className="text-foreground">
              {deleteConfirm.target?.description}
            </strong>{' '}
            will be removed and the account balance put back as it was. This cannot be
            undone.
          </>
        }
        onConfirm={() =>
          deleteConfirm.target
            ? run(
                () => deleteTransactionAction(deleteConfirm.target!.id),
                'Entry deleted',
              )
            : undefined
        }
      />
    </>
  );
}
