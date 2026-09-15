'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Banknote, CreditCard, Pencil, Plus, Smartphone, Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { RowActions } from '@/components/shared/row-actions';
import { ConfirmDialog, useConfirm } from '@/components/shared/confirm-dialog';
import { deleteAccountAction } from '@/server/actions/accounts';
import { formatCurrency } from '@/lib/money';
import { humanizeEnum } from '@/lib/utils';
import type { AccountRow } from '@/server/services/accounts';
import type { AccountInput } from '@/lib/validations/account';

import { AccountDialog } from './account-dialog';

const ICONS: Record<string, typeof Wallet> = {
  BANK: Banknote,
  CASH: Wallet,
  MOBILE_MONEY: Smartphone,
  CREDIT_CARD: CreditCard,
  OTHER: Wallet,
};

export function AccountsManager({
  rows,
  currency,
  can,
}: {
  rows: AccountRow[];
  currency: string;
  can: { create: boolean; edit: boolean; delete: boolean };
}) {
  const router = useRouter();
  const deleteConfirm = useConfirm<AccountRow>();
  const [editing, setEditing] = React.useState<AccountRow | null>(null);
  const [open, setOpen] = React.useState(false);

  const defaults: Partial<AccountInput> | undefined = editing
    ? {
        name: editing.name,
        type: editing.type as AccountInput['type'],
        bankName: editing.bankName ?? '',
        accountNumber: editing.accountNumber ?? '',
        openingBalance: editing.openingBalance,
        isPrimary: editing.isPrimary,
        isActive: editing.isActive,
      }
    : undefined;

  if (rows.length === 0) {
    return (
      <>
        <EmptyState
          icon={Wallet}
          title="No accounts yet"
          description="Add the bank accounts, cash tins and wallets your money moves through, and every payment can say where it landed."
          action={
            can.create ? (
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setOpen(true);
                }}
              >
                <Plus /> Add an account
              </Button>
            ) : undefined
          }
        />
        <AccountDialog open={open} onOpenChange={setOpen} />
      </>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((account) => {
          const Icon = ICONS[account.type] ?? Wallet;
          return (
            <Card
              key={account.id}
              className={`p-5 ${account.isActive ? 'hover-lift' : 'opacity-70'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-semibold">{account.name}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {humanizeEnum(account.type)}
                      {account.bankName ? ` · ${account.bankName}` : ''}
                    </p>
                  </div>
                </div>
                <RowActions
                  actions={[
                    ...(can.edit
                      ? [
                          {
                            label: 'Edit',
                            icon: Pencil,
                            onSelect: () => {
                              setEditing(account);
                              setOpen(true);
                            },
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
                            onSelect: () => deleteConfirm.ask(account),
                          },
                        ]
                      : []),
                  ]}
                />
              </div>

              <p className="mt-4 text-2xl font-semibold tracking-[-0.02em] tabular">
                {formatCurrency(account.currentBalance, { currency })}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {account.isPrimary ? <Badge size="sm">Primary</Badge> : null}
                {!account.isActive ? (
                  <Badge variant="neutral" size="sm">
                    Inactive
                  </Badge>
                ) : null}
                <span className="text-[11.5px] text-muted-foreground">
                  {account.transactionCount} transaction
                  {account.transactionCount === 1 ? '' : 's'}
                </span>
              </div>
            </Card>
          );
        })}

        {can.create ? (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setOpen(true);
            }}
            className="flex min-h-[9rem] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft/30 hover:text-primary"
          >
            <Plus className="size-5" />
            <span className="text-[13px] font-medium">Add an account</span>
          </button>
        ) : null}
      </div>

      <AccountDialog
        key={editing?.id ?? 'new'}
        accountId={editing?.id}
        defaultValues={defaults}
        open={open}
        onOpenChange={setOpen}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title="Remove this account?"
        destructive
        confirmLabel="Remove account"
        description={
          <>
            <strong className="text-foreground">{deleteConfirm.target?.name}</strong>{' '}
            will be removed. Accounts with movements against them cannot be deleted, so
            mark those inactive instead.
          </>
        }
        onConfirm={async () => {
          if (!deleteConfirm.target) return;
          const result = await deleteAccountAction(deleteConfirm.target.id);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success('Account removed');
          router.refresh();
        }}
      />
    </>
  );
}
