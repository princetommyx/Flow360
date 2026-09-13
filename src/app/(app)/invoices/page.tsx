import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { ExportButton } from '@/components/shared/export-button';
import { formatCurrency } from '@/lib/money';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { hasPermission } from '@/lib/permissions';
import { requirePermission } from '@/server/tenant';
import { listInvoices } from '@/server/services/invoices';
import { customerOptions } from '@/server/services/customers';
import { refreshOverdueInvoices } from '@/server/actions/payments';

import { InvoicesTable } from './invoices-table';

export const metadata: Metadata = { title: 'Invoices' };

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const context = await requirePermission('invoices.view');

  // Overdue is a function of the date, not of any user action, so it is
  // re-derived when the list is opened.
  await refreshOverdueInvoices(context.organization.id);

  const query = parseListQuery(params, { sort: 'issueDate', dir: 'desc' });
  const [{ rows, pageInfo, summary }, customers] = await Promise.all([
    listInvoices(context.organization.id, query),
    customerOptions(context.organization.id),
  ]);

  const can = {
    create: hasPermission(context.permissions, 'invoices.create'),
    edit: hasPermission(context.permissions, 'invoices.edit'),
    delete: hasPermission(context.permissions, 'invoices.delete'),
    export: hasPermission(context.permissions, 'invoices.export'),
  };

  const currency = context.organization.currency;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Everything you have billed, and what is still to come in."
        actions={
          <>
            {can.export ? <ExportButton /> : null}
            {can.create ? (
              <Button size="sm" asChild>
                <Link href="/invoices/new">
                  <Plus /> New invoice
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">
            Invoiced (matching this view)
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            {formatCurrency(summary.invoiced, { currency })}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">
            Outstanding (matching this view)
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            {formatCurrency(summary.outstanding, { currency })}
          </p>
        </Card>
      </div>

      <InvoicesTable
        rows={rows}
        pageInfo={pageInfo}
        isFiltered={Boolean(query.q) || Object.keys(query.filters).length > 0}
        currency={currency}
        customers={customers.map((customer) => ({
          id: customer.id,
          name: customer.companyName ?? customer.name,
        }))}
        can={can}
      />
    </div>
  );
}
