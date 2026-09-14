import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { ExportButton } from '@/components/shared/export-button';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { hasPermission } from '@/lib/permissions';
import { requirePermission } from '@/server/tenant';
import { listSuppliers } from '@/server/services/suppliers';

import { SuppliersTable } from './suppliers-table';

export const metadata: Metadata = { title: 'Suppliers' };

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const context = await requirePermission('suppliers.view');

  const query = parseListQuery(params, { sort: 'createdAt', dir: 'desc' });
  const { rows, pageInfo } = await listSuppliers(context.organization.id, query);

  const can = {
    create: hasPermission(context.permissions, 'suppliers.create'),
    edit: hasPermission(context.permissions, 'suppliers.edit'),
    delete: hasPermission(context.permissions, 'suppliers.delete'),
    export: hasPermission(context.permissions, 'suppliers.export'),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Who you buy from, what you have been billed, and what is still owed."
        actions={
          <>
            {can.export ? <ExportButton /> : null}
            {can.create ? (
              <Button size="sm" asChild>
                <Link href="/suppliers/new">
                  <Plus /> New supplier
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <SuppliersTable
        rows={rows}
        pageInfo={pageInfo}
        isFiltered={Boolean(query.q) || Object.keys(query.filters).length > 0}
        currency={context.organization.currency}
        can={can}
      />
    </div>
  );
}
