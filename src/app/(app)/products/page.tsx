import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus, Tags } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { ExportButton } from '@/components/shared/export-button';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { hasPermission } from '@/lib/permissions';
import { requirePermission } from '@/server/tenant';
import { categoryOptions, listProducts } from '@/server/services/products';

import { ProductsTable } from './products-table';

export const metadata: Metadata = { title: 'Products & services' };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const context = await requirePermission('products.view');

  const query = parseListQuery(params, { sort: 'name', dir: 'asc' });
  const [{ rows, pageInfo }, categories] = await Promise.all([
    listProducts(context.organization.id, query),
    categoryOptions(context.organization.id),
  ]);

  const can = {
    create: hasPermission(context.permissions, 'products.create'),
    edit: hasPermission(context.permissions, 'products.edit'),
    delete: hasPermission(context.permissions, 'products.delete'),
    export: hasPermission(context.permissions, 'products.export'),
    adjust: hasPermission(context.permissions, 'inventory.edit'),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products & services"
        description="Everything you sell, with its pricing, tax treatment and stock position."
        actions={
          <>
            <Button variant="secondary" size="sm" asChild>
              <Link href="/categories">
                <Tags /> Categories
              </Link>
            </Button>
            {can.export ? <ExportButton /> : null}
            {can.create ? (
              <Button size="sm" asChild>
                <Link href="/products/new">
                  <Plus /> Add product
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <ProductsTable
        rows={rows}
        pageInfo={pageInfo}
        isFiltered={Boolean(query.q) || Object.keys(query.filters).length > 0}
        currency={context.organization.currency}
        categories={categories}
        can={can}
      />
    </div>
  );
}
