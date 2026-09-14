'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRightLeft,
  Check,
  Copy,
  Pencil,
  ReceiptText,
  RotateCcw,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/data-table/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { RowActions } from '@/components/shared/row-actions';
import { ConfirmDialog, useConfirm } from '@/components/shared/confirm-dialog';
import {
  acceptQuotationAction,
  convertQuotationAction,
  deleteQuotationAction,
  duplicateQuotationAction,
  reopenQuotationAction,
  rejectQuotationAction,
  sendQuotationAction,
} from '@/server/actions/quotations';
import { formatCurrency } from '@/lib/money';
import { formatDate } from '@/lib/date';
import type { PageInfo } from '@/lib/query';
import type { QuotationListRow } from '@/server/services/quotations';

type Props = {
  rows: QuotationListRow[];
  pageInfo: PageInfo;
  isFiltered: boolean;
  currency: string;
  customers: Array<{ id: string; name: string }>;
  can: { create: boolean; edit: boolean; delete: boolean; invoice: boolean };
};

export function QuotationsTable({
  rows,
  pageInfo,
  isFiltered,
  currency,
  customers,
  can,
}: Props) {
  const router = useRouter();
  const deleteConfirm = useConfirm<QuotationListRow>();
  const convertConfirm = useConfirm<QuotationListRow>();

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

  const identity = (quotation: QuotationListRow) => (
    <div className="min-w-0">
      <p className="flex items-center gap-2">
        <span className="font-mono text-[13px] font-medium">{quotation.number}</span>
        <StatusBadge status={quotation.status} size="sm" />
      </p>
      <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
        {quotation.customerName}
      </p>
    </div>
  );

  const columns: Array<DataTableColumn<QuotationListRow>> = [
    { id: 'number', header: 'Quotation', sortable: true, cell: identity },
    {
      id: 'issueDate',
      header: 'Issued',
      sortable: true,
      hideBelow: 'lg',
      optional: true,
      cell: (quotation) => (
        <span className="text-[13px] text-muted-foreground">
          {formatDate(quotation.issueDate)}
        </span>
      ),
    },
    {
      id: 'expiryDate',
      header: 'Valid until',
      sortable: true,
      hideBelow: 'md',
      cell: (quotation) => (
        <span
          className={
            quotation.hasLapsed
              ? 'text-[13px] font-medium text-warning-foreground'
              : 'text-[13px] text-muted-foreground'
          }
        >
          {formatDate(quotation.expiryDate)}
        </span>
      ),
    },
    {
      id: 'invoice',
      header: 'Invoice',
      hideBelow: 'xl',
      optional: true,
      cell: (quotation) =>
        quotation.invoiceId ? (
          <Link
            href={`/invoices/${quotation.invoiceId}`}
            onClick={(event) => event.stopPropagation()}
            className="font-mono text-[12.5px] text-primary hover:underline"
          >
            {quotation.invoiceNumber}
          </Link>
        ) : (
          <span className="text-[13px] text-muted-foreground">—</span>
        ),
    },
    {
      id: 'total',
      header: 'Total',
      sortable: true,
      align: 'right',
      cell: (quotation) => (
        <span className="text-[13px] font-semibold tabular">
          {formatCurrency(quotation.total, { currency })}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      align: 'right',
      cell: (quotation) => (
        <RowActions
          actions={[
            ...(can.edit && quotation.status === 'DRAFT'
              ? [
                  { label: 'Edit', icon: Pencil, href: `/quotations/${quotation.id}/edit` },
                  {
                    label: 'Send',
                    icon: Send,
                    onSelect: () =>
                      run(
                        () => sendQuotationAction(quotation.id),
                        `${quotation.number} sent`,
                      ),
                  },
                ]
              : []),
            ...(can.edit && ['SENT', 'EXPIRED', 'REJECTED'].includes(quotation.status)
              ? [
                  {
                    label: 'Mark accepted',
                    icon: Check,
                    onSelect: () =>
                      run(
                        () => acceptQuotationAction(quotation.id),
                        `${quotation.number} marked accepted`,
                      ),
                  },
                ]
              : []),
            ...(can.edit && ['SENT', 'ACCEPTED'].includes(quotation.status)
              ? [
                  {
                    label: 'Mark declined',
                    icon: X,
                    onSelect: () =>
                      run(
                        () => rejectQuotationAction(quotation.id),
                        `${quotation.number} marked declined`,
                      ),
                  },
                ]
              : []),
            ...(can.edit && ['REJECTED', 'EXPIRED'].includes(quotation.status)
              ? [
                  {
                    label: 'Reopen',
                    icon: RotateCcw,
                    onSelect: () =>
                      run(
                        () => reopenQuotationAction(quotation.id),
                        `${quotation.number} reopened`,
                      ),
                  },
                ]
              : []),
            ...(can.invoice && quotation.status === 'ACCEPTED' && !quotation.invoiceId
              ? [
                  {
                    label: 'Convert to invoice',
                    icon: ArrowRightLeft,
                    separatorBefore: true,
                    onSelect: () => convertConfirm.ask(quotation),
                  },
                ]
              : []),
            ...(can.create
              ? [
                  {
                    label: 'Duplicate',
                    icon: Copy,
                    onSelect: async () => {
                      const result = await duplicateQuotationAction(quotation.id);
                      if (!result.ok) {
                        toast.error(result.error);
                        return;
                      }
                      toast.success(`Copied to ${result.data.number}`);
                      router.push(`/quotations/${result.data.id}/edit`);
                    },
                  },
                ]
              : []),
            ...(can.delete && !quotation.invoiceId
              ? [
                  {
                    label: 'Delete',
                    icon: Trash2,
                    destructive: true,
                    separatorBefore: true,
                    onSelect: () => deleteConfirm.ask(quotation),
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
        rowKey={(quotation) => quotation.id}
        rowHref={(quotation) => `/quotations/${quotation.id}`}
        pageInfo={pageInfo}
        isFiltered={isFiltered}
        searchPlaceholder="Search number or customer…"
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'DRAFT', label: 'Draft' },
              { value: 'SENT', label: 'Sent' },
              { value: 'ACCEPTED', label: 'Accepted' },
              { value: 'REJECTED', label: 'Declined' },
              { value: 'EXPIRED', label: 'Expired' },
              { value: 'CONVERTED', label: 'Converted' },
            ],
          },
          {
            key: 'range',
            label: 'Show',
            allLabel: 'All quotations',
            options: [
              { value: 'open', label: 'Still open' },
              { value: 'expiring', label: 'Past their date' },
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
        mobileRow={(quotation) => (
          <div className="flex items-start justify-between gap-3">
            {identity(quotation)}
            <div className="shrink-0 text-right">
              <p className="text-[13px] font-semibold tabular">
                {formatCurrency(quotation.total, { currency })}
              </p>
              <p className="text-[11.5px] text-muted-foreground">
                until {formatDate(quotation.expiryDate, 'dd MMM')}
              </p>
            </div>
          </div>
        )}
        empty={
          <EmptyState
            icon={ReceiptText}
            title="No quotations yet"
            description="Price a job here first. Once the customer accepts, it becomes an invoice without retyping a line."
            action={
              can.create ? (
                <Button size="sm" asChild>
                  <Link href="/quotations/new">Create a quotation</Link>
                </Button>
              ) : undefined
            }
          />
        }
      />

      <ConfirmDialog
        open={convertConfirm.open}
        onOpenChange={convertConfirm.onOpenChange}
        title="Turn this into an invoice?"
        confirmLabel="Create the invoice"
        description={
          <>
            <strong className="text-foreground">{convertConfirm.target?.number}</strong>{' '}
            will be copied into a new draft invoice with the same lines and totals.
            Nothing is sent and no stock moves until you send that invoice.
          </>
        }
        onConfirm={() =>
          convertConfirm.target
            ? run(async () => {
                const result = await convertQuotationAction(convertConfirm.target!.id);
                if (result.ok) router.push(`/invoices/${result.data.invoiceId}`);
                return result;
              }, 'Invoice created from the quotation')
            : undefined
        }
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={deleteConfirm.onOpenChange}
        title="Delete this quotation?"
        destructive
        confirmLabel="Delete quotation"
        description={
          <>
            <strong className="text-foreground">{deleteConfirm.target?.number}</strong>{' '}
            will be removed from your lists. This cannot be undone.
          </>
        }
        onConfirm={() =>
          deleteConfirm.target
            ? run(
                () => deleteQuotationAction(deleteConfirm.target!.id),
                'Quotation deleted',
              )
            : undefined
        }
      />
    </>
  );
}
