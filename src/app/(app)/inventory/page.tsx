import type { Metadata } from 'next';

import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { ExportButton } from '@/components/shared/export-button';
import { CountUp } from '@/components/shared/count-up';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { hasPermission } from '@/lib/permissions';
import { requirePermission } from '@/server/tenant';
import { inventorySummary, listStockLevels } from '@/server/services/inventory';
import { categoryOptions } from '@/server/services/products';

import { InventoryTable } from './inventory-table';

export const metadata: Metadata = { title: 'Inventory' };

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const context = await requirePermission('inventory.view');
  const currency = context.organization.currency;

  const query = parseListQuery(params, { sort: 'name', dir: 'asc' });
  const [{ rows, pageInfo }, summary, categories] = await Promise.all([
    listStockLevels(context.organization.id, query),
    inventorySummary(context.organization.id),
    categoryOptions(context.organization.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory"
        description="What is on the shelf, what it is worth, and what needs ordering."
        actions={
          hasPermission(context.permissions, 'inventory.export') ? <ExportButton /> : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">Stock value</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={summary.value} kind="currency" currency={currency} decimals={2} />
          </p>
        </Card>
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">Tracked items</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={summary.skuCount} />
          </p>
        </Card>
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">Need reordering</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={summary.needsReorder} />
          </p>
        </Card>
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">Out of stock</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={summary.outOfStock} />
          </p>
        </Card>
      </div>

      <InventoryTable
        rows={rows}
        pageInfo={pageInfo}
        isFiltered={Boolean(query.q) || Object.keys(query.filters).length > 0}
        currency={currency}
        categories={categories}
      />
    </div>
  );
}
