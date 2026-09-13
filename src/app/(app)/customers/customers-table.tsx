'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, FilePlus2, Pencil, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { DataTable, type DataTableColumn } from '@/components/data-table/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { RowActions } from '@/components/shared/row-actions';
import { ConfirmDialog, useConfirm } from '@/components/shared/confirm-dialog';
import { deleteCustomerAction } from '@/server/actions/customers';
import { formatCurrency } from '@/lib/money';
import { formatDate } from '@/lib/date';
import { initials } from '@/lib/utils';
import type { PageInfo } from '@/lib/query';
import type { CustomerListRow } from '@/server/services/customers';

type Props = {
  rows: CustomerListRow[];
  pageInfo: PageInfo;
  isFiltered: boolean;
  currency: string;
  can: { create: boolean; edit: boolean; delete: boolean; invoice: boolean };
};

export function CustomersTable({ rows, pageInfo, isFiltered, currency, can }: Props) {
  const router = useRouter();
  const confirm = useConfirm<CustomerListRow>();

  async function remove(customer: CustomerListRow) {
    const result = await deleteCustomerAction(customer.id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(`${customer.companyName ?? customer.name} removed`);
    router.refresh();
  }

  const identity = (customer: CustomerListRow) => (
    <div className="flex items-center gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[11px] font-semibold text-primary">
        {initials(customer.companyName ?? customer.name)}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[13.5px] font-medium">
          {customer.companyName ?? customer.name}
        </p>
        <p className="truncate text-[12px] text-muted-foreground">
          {customer.companyName ? customer.name : (customer.email ?? '—')}
        </p>
      </div>
    </div>
  );

  const columns: Array<DataTableColumn<CustomerListRow>> = [
    { id: 'name', header: 'Customer', sortable: true, cell: identity },
    {
      id: 'email',
      header: 'Contact',
      hideBelow: 'lg',
      cell: (customer) => (
        <div className="min-w-0">
          <p className="truncate text-[13px]">{customer.email ?? '—'}</p>
          <p className="truncate text-[12px] text-muted-foreground">
            {customer.phone ?? '—'}
          </p>
        </div>
      ),
    },
    {
      id: 'city',
      header: 'Location',
      sortable: true,
      hideBelow: 'xl',
      optional: true,
      cell: (customer) => customer.city ?? '—',
    },
    {
      id: 'invoiced',
      header: 'Invoiced',
      align: 'right',
      hideBelow: 'md',
      cell: (customer) => (
        <span className="tabular">
          {formatCurrency(customer.totalInvoiced, { currency })}
        </span>
      ),
    },
    {
      id: 'outstanding',
      header: 'Outstanding',
      align: 'right',
      cell: (customer) => (
        <span
          className={`tabular ${customer.outstanding > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
        >
          {formatCurrency(customer.outstanding, { currency })}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      align: 'center',
      hideBelow: 'sm',
      cell: (customer) => <StatusBadge status={customer.status} size="sm" />,
    },
    {
      id: 'actions',
      header: <span className="sr-only">Actions</span>,
      align: 'right',
      width: '3.5rem',
      cell: (customer) => (
        <RowActions
          label={`Actions for ${customer.name}`}
          actions={[
            { label: 'View profile', icon: Eye, href: `/customers/${customer.id}` },
            ...(can.edit
              ? [{ label: 'Edit', icon: Pencil, href: `/customers/${customer.id}/edit` }]
              : []),
            ...(can.invoice
              ? [
                  {
                    label: 'New invoice',
                    icon: FilePlus2,
                    href: `/invoices/new?customerId=${customer.id}`,
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
                    onSelect: () => confirm.ask(customer),
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
        rowKey={(customer) => customer.id}
        rowHref={(customer) => `/customers/${customer.id}`}
        pageInfo={pageInfo}
        isFiltered={isFiltered}
        searchPlaceholder="Search name, company, email…"
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
        mobileRow={(customer) => (
          <div className="flex items-start justify-between gap-3">
            {identity(customer)}
            <div className="shrink-0 text-right">
              <p className="text-[13px] font-semibold tabular">
                {formatCurrency(customer.outstanding, { currency })}
              </p>
              <p className="text-[11.5px] text-muted-foreground">outstanding</p>
            </div>
          </div>
        )}
        empty={
          <EmptyState
            icon={Users}
            title="No customers yet"
            description="Add the businesses and people you sell to. Everything you quote, invoice and get paid hangs off a customer record."
            action={
              can.create ? (
                <Button size="sm" asChild>
                  <Link href="/customers/new">Add your first customer</Link>
                </Button>
              ) : undefined
            }
          />
        }
        emptyFiltered={
          <EmptyState
            icon={Users}
            title="No customers match"
            description="Try a different search term, or clear the status filter."
          />
        }
      />

      <ConfirmDialog
        open={confirm.open}
        onOpenChange={confirm.onOpenChange}
        title="Remove this customer?"
        destructive
        confirmLabel="Remove customer"
        description={
          <>
            <strong className="text-foreground">
              {confirm.target?.companyName ?? confirm.target?.name}
            </strong>{' '}
            will be removed from your customer list. Existing invoices, quotations
            and payments are kept so your records stay complete.
          </>
        }
        onConfirm={() => (confirm.target ? remove(confirm.target) : undefined)}
      />
    </>
  );
}
