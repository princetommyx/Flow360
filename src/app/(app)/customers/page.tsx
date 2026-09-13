import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { ExportButton } from '@/components/shared/export-button';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { hasPermission } from '@/lib/permissions';
import { requirePermission } from '@/server/tenant';
import { listCustomers } from '@/server/services/customers';

import { CustomersTable } from './customers-table';

export const metadata: Metadata = { title: 'Customers' };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const context = await requirePermission('customers.view');

  const query = parseListQuery(params, { sort: 'createdAt', dir: 'desc' });
  const { rows, pageInfo } = await listCustomers(context.organization.id, query);

  const can = {
    create: hasPermission(context.permissions, 'customers.create'),
    edit: hasPermission(context.permissions, 'customers.edit'),
    delete: hasPermission(context.permissions, 'customers.delete'),
    export: hasPermission(context.permissions, 'customers.export'),
    invoice: hasPermission(context.permissions, 'invoices.create'),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Everyone you sell to, with their balance, history and terms in one place."
        actions={
          <>
            {can.export ? <ExportButton /> : null}
            {can.create ? (
              <Button size="sm" asChild>
                <Link href="/customers/new">
                  <Plus /> Add customer
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <CustomersTable
        rows={rows}
        pageInfo={pageInfo}
        isFiltered={Boolean(query.q) || Object.keys(query.filters).length > 0}
        currency={context.organization.currency}
        can={can}
      />
    </div>
  );
}
