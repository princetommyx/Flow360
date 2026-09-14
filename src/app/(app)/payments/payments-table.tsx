'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { HandCoins, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { DataTable, type DataTableColumn } from '@/components/data-table/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { RowActions } from '@/components/shared/row-actions';
import { ConfirmDialog, useConfirm } from '@/components/shared/confirm-dialog';
import { deletePaymentAction } from '@/server/actions/payments';
import { formatCurrency } from '@/lib/money';
import { formatDate } from '@/lib/date';
import { humanizeEnum } from '@/lib/utils';
import type { PageInfo } from '@/lib/query';
import type { PaymentListRow } from '@/server/services/payments';

type Props = {
  rows: PaymentListRow[];
  pageInfo: PageInfo;
  isFiltered: boolean;
  currency: string;
  customers: Array<{ id: string; name: string }>;
  accounts: Array<{ id: string; name: string }>;
  can: { delete: boolean };
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

export function PaymentsTable({
  rows,
  pageInfo,
  isFiltered,
  currency,
  customers,
  accounts,
  can,
}: Props) {
  const router = useRouter();
  const deleteConfirm = useConfirm<PaymentListRow>();

  const identity = (payment: PaymentListRow) => (
    <div className="min-w-0">
      <p className="font-mono text-[13px] font-medium">{payment.number}</p>
      <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
        {payment.customerName ?? 'Unattributed'}
      </p>
    </div>
  );

  const columns: Array<DataTableColumn<PaymentListRow>> = [
    { id: 'number', header: 'Payment', sortable: true, cell: identity },
    {
      id: 'paidAt',
      header: 'Received',
      sortable: true,
      cell: (payment) => (
        <span className="text-[13px] text-muted-foreground">
          {formatDate(payment.paidAt)}
        </span>
      ),
    },
    {
      id: 'invoice',
      header: 'Against',
      hideBelow: 'md',
      cell: (payment) =>
        payment.invoiceId ? (
          <Link
            href={`/invoices/${payment.invoiceId}`}
            className="font-mono text-[12.5px] text-primary hover:underline"
          >
            {payment.invoiceNumber}
          </Link>
        ) : (
          <span className="text-[13px] text-muted-foreground">—</span>
        ),
    },
    {
      id: 'method',
      header: 'Method',
      sortable: true,
      hideBelow: 'lg',
      cell: (payment) => (
        <span className="text-[13px]">{humanizeEnum(payment.method)}</span>
      ),
    },
    {
      id: 'account',
      header: 'Into',
      hideBelow: 'xl',
      optional: true,
      cell: (payment) => (
        <span className="text-[13px] text-muted-foreground">
          {payment.accountName ?? '—'}
        </span>
      ),
    },
    {
      id: 'amount',
      header: 'Amount',
      sortable: true,
      align: 'right',
      cell: (payment) => (
        <span className="text-[13px] font-semibold tabular text-success">
          {formatCurrency(payment.amount, { currency })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: (payment) => (
        <RowActions
          actions={
            can.delete
              ? [
                  {
                    label: 'Delete payment',
                    icon: Trash2,
                    destructive: true,
                    onSelect: () => deleteConfirm.ask(payment),
                  },
                ]
              : []
          }
        />
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(payment) => payment.id}
        pageInfo={pageInfo}
        isFiltered={isFiltered}
        searchPlaceholder="Search payment, invoice, reference, customer…"
        filters={[
          {
            key: 'method',
            label: 'Method',
            options: METHODS.map((method) => ({
              value: method,
              label: humanizeEnum(method),
            })),
          },
          {
            key: 'customerId',
            label: 'Customer',
            options: customers.map((customer) => ({
              value: customer.id,
              label: customer.name,
            })),
          },
          {
            key: 'accountId',
            label: 'Account',
            options: accounts.map((account) => ({
              value: account.id,
              label: account.name,
            })),
          },
        ]}
        mobileRow={(payment) => (
          <div className="flex items-start justify-between gap-3">
            {identity(payment)}
            <div className="shrink-0 text-right">
              <p className="text-[13px] font-semibold tabular text-success">
                {formatCurrency(payment.amount, { currency })}
              </p>
              <p className="text-[11.5px] text-muted-foreground">
                {formatDate(payment.paidAt, 'dd MMM')}
              </p>
            </div>
          </div>
        )}
        empty={
          <EmptyState
            icon={HandCoins}
            title="No payments yet"
            description="Record a payment against an invoice and it will appear here, with the invoice balance updated."
          />
        }
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title="Delete this payment?"
        destructive
        confirmLabel="Delete payment"
        description={
          <>
            <strong className="text-foreground">{deleteConfirm.target?.number}</strong>{' '}
            will be removed and the invoice it was against will go back to owing that
            amount. This cannot be undone.
          </>
        }
        onConfirm={async () => {
          if (!deleteConfirm.target) return;
          const result = await deletePaymentAction(deleteConfirm.target.id);
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success('Payment deleted');
          router.refresh();
        }}
      />
    </>
  );
}
