'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Ban, Copy, Eye, FileText, Pencil, Send, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/data-table/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { RowActions } from '@/components/shared/row-actions';
import { ConfirmDialog, useConfirm } from '@/components/shared/confirm-dialog';
import {
  cancelInvoiceAction,
  deleteInvoiceAction,
  duplicateInvoiceAction,
  sendInvoiceAction,
} from '@/server/actions/invoices';
import { formatCurrency } from '@/lib/money';
import { formatDate, daysOverdue } from '@/lib/date';
import type { PageInfo } from '@/lib/query';
import type { InvoiceListRow } from '@/server/services/invoices';

type Props = {
  rows: InvoiceListRow[];
  pageInfo: PageInfo;
  isFiltered: boolean;
  currency: string;
  customers: Array<{ id: string; name: string }>;
  can: { create: boolean; edit: boolean; delete: boolean };
};

export function InvoicesTable({
  rows,
  pageInfo,
  isFiltered,
  currency,
  customers,
  can,
}: Props) {
  const router = useRouter();
  const cancelConfirm = useConfirm<InvoiceListRow>();
  const deleteConfirm = useConfirm<InvoiceListRow>();

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

  const identity = (invoice: InvoiceListRow) => (
    <div className="min-w-0">
      <p className="flex items-center gap-2">
        <span className="font-mono text-[13px] font-medium">{invoice.number}</span>
        <StatusBadge status={invoice.status} size="sm" />
      </p>
      <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
        {invoice.customerName}
      </p>
    </div>
  );

  const columns: Array<DataTableColumn<InvoiceListRow>> = [
    { id: 'number', header: 'Invoice', sortable: true, cell: identity },
    {
      id: 'issueDate',
      header: 'Issued',
      sortable: true,
      hideBelow: 'lg',
      optional: true,
      cell: (invoice) => (
        <span className="text-[13px] text-muted-foreground">
          {formatDate(invoice.issueDate)}
        </span>
      ),
    },
    {
      id: 'dueDate',
      header: 'Due',
      sortable: true,
      hideBelow: 'md',
      cell: (invoice) => (
        <div>
          <p className="text-[13px]">{formatDate(invoice.dueDate)}</p>
          {invoice.isOverdue ? (
            <p className="text-[11.5px] font-medium text-destructive">
              {daysOverdue(invoice.dueDate)} days late
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: 'total',
      header: 'Total',
      sortable: true,
      align: 'right',
      cell: (invoice) => (
        <span className="font-medium tabular">
          {formatCurrency(invoice.total, { currency })}
        </span>
      ),
    },
    {
      id: 'balanceDue',
      header: 'Outstanding',
      sortable: true,
      align: 'right',
      hideBelow: 'sm',
      cell: (invoice) => (
        <span
          className={`tabular ${invoice.balanceDue > 0 ? 'font-medium' : 'text-muted-foreground'}`}
        >
          {formatCurrency(invoice.balanceDue, { currency })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      width: '3.5rem',
      cell: (invoice) => {
        const isDraft = invoice.status === 'DRAFT';
        const isCancelled = invoice.status === 'CANCELLED';
        return (
          <RowActions
            label={`Actions for ${invoice.number}`}
            actions={[
              { label: 'View', icon: Eye, href: `/invoices/${invoice.id}` },
              ...(can.edit && isDraft
                ? [{ label: 'Edit', icon: Pencil, href: `/invoices/${invoice.id}/edit` }]
                : []),
              ...(can.edit && isDraft
                ? [
                    {
                      label: 'Send',
                      icon: Send,
                      onSelect: () =>
                        run(
                          () => sendInvoiceAction(invoice.id),
                          `${invoice.number} sent`,
                        ),
                    },
                  ]
                : []),
              ...(can.create
                ? [
                    {
                      label: 'Duplicate',
                      icon: Copy,
                      onSelect: async () => {
                        const result = await duplicateInvoiceAction(invoice.id);
                        if (!result.ok) {
                          toast.error(result.error);
                          return;
                        }
                        toast.success(`Copied to ${result.data.number}`);
                        router.push(`/invoices/${result.data.id}/edit`);
                      },
                    },
                  ]
                : []),
              ...(can.edit && !isDraft && !isCancelled
                ? [
                    {
                      label: 'Cancel invoice',
                      icon: Ban,
                      destructive: true,
                      separatorBefore: true,
                      onSelect: () => cancelConfirm.ask(invoice),
                    },
                  ]
                : []),
              ...(can.delete && isDraft
                ? [
                    {
                      label: 'Delete draft',
                      icon: Trash2,
                      destructive: true,
                      separatorBefore: true,
                      onSelect: () => deleteConfirm.ask(invoice),
                    },
                  ]
                : []),
            ]}
          />
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(invoice) => invoice.id}
        rowHref={(invoice) => `/invoices/${invoice.id}`}
        pageInfo={pageInfo}
        isFiltered={isFiltered}
        searchPlaceholder="Search number, reference, customer…"
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'DRAFT', label: 'Draft' },
              { value: 'SENT', label: 'Sent' },
              { value: 'VIEWED', label: 'Viewed' },
              { value: 'PARTIALLY_PAID', label: 'Partially paid' },
              { value: 'PAID', label: 'Paid' },
              { value: 'OVERDUE', label: 'Overdue' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ],
          },
          {
            key: 'range',
            label: 'Show',
            allLabel: 'All invoices',
            options: [
              { value: 'open', label: 'Awaiting payment' },
              { value: 'overdue', label: 'Past due' },
            ],
          },
          {
            key: 'customerId',
            label: 'Customer',
            options: customers.map((customer) => ({
              value: customer.id,
              label: customer.name,
            })),
          },
        ]}
        mobileRow={(invoice) => (
          <div className="flex items-start justify-between gap-3">
            {identity(invoice)}
            <div className="shrink-0 text-right">
              <p className="text-[13px] font-semibold tabular">
                {formatCurrency(invoice.total, { currency })}
              </p>
              <p className="text-[11.5px] text-muted-foreground">
                due {formatDate(invoice.dueDate, 'dd MMM')}
              </p>
            </div>
          </div>
        )}
        empty={
          <EmptyState
            icon={FileText}
            title="No invoices yet"
            description="Raise your first invoice and it will appear here with its payment status tracked automatically."
            action={
              can.create ? (
                <Button size="sm" asChild>
                  <Link href="/invoices/new">Create an invoice</Link>
                </Button>
              ) : undefined
            }
          />
        }
      />

      <ConfirmDialog
        open={cancelConfirm.open}
        onOpenChange={cancelConfirm.onOpenChange}
        title="Cancel this invoice?"
        destructive
        confirmLabel="Cancel invoice"
        cancelLabel="Keep it"
        description={
          <>
            <strong className="text-foreground">{cancelConfirm.target?.number}</strong>{' '}
            will be marked cancelled and its outstanding balance cleared. Any stock it
            took out is returned to inventory. The record is kept for your books.
          </>
        }
        onConfirm={() =>
          cancelConfirm.target
            ? run(
                () => cancelInvoiceAction(cancelConfirm.target!.id),
                `${cancelConfirm.target.number} cancelled`,
              )
            : undefined
        }
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title="Delete this draft?"
        destructive
        confirmLabel="Delete draft"
        description={
          <>
            <strong className="text-foreground">{deleteConfirm.target?.number}</strong>{' '}
            has never been sent, so it can be removed completely. This cannot be undone.
          </>
        }
        onConfirm={() =>
          deleteConfirm.target
            ? run(
                () => deleteInvoiceAction(deleteConfirm.target!.id),
                'Draft deleted',
              )
            : undefined
        }
      />
    </>
  );
}
