import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared/page-header';
import { ExportButton } from '@/components/shared/export-button';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { hasPermission } from '@/lib/permissions';
import { requirePermission } from '@/server/tenant';
import { listStockMovements } from '@/server/services/inventory';
import { productOptions } from '@/server/services/products';

import { MovementsTable } from './movements-table';

export const metadata: Metadata = { title: 'Stock adjustments' };

export default async function StockAdjustmentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const context = await requirePermission('inventory.view');

  const query = parseListQuery(params, { sort: 'occurredAt', dir: 'desc' });
  const [{ rows, pageInfo }, products] = await Promise.all([
    listStockMovements(context.organization.id, query),
    productOptions(context.organization.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock adjustments"
        description="Every movement in and out, so any stock level can be traced back to what caused it."
        actions={
          hasPermission(context.permissions, 'inventory.export') ? <ExportButton /> : null
        }
      />

      <MovementsTable
        rows={rows}
        pageInfo={pageInfo}
        isFiltered={Boolean(query.q) || Object.keys(query.filters).length > 0}
        products={products.map((product) => ({ id: product.id, name: product.name }))}
      />
    </div>
  );
}
