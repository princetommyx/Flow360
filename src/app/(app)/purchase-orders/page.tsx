import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { ExportButton } from '@/components/shared/export-button';
import { CountUp } from '@/components/shared/count-up';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { hasPermission } from '@/lib/permissions';
import { requirePermission } from '@/server/tenant';
import {
  listPurchaseOrders,
  purchaseOrderTotals,
  supplierOptions,
} from '@/server/services/purchase-orders';

import { PurchaseOrdersTable } from './purchase-orders-table';

export const metadata: Metadata = { title: 'Purchase orders' };

export default async function PurchaseOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const context = await requirePermission('purchases.view');

  const query = parseListQuery(params, { sort: 'orderDate', dir: 'desc' });
  const [{ rows, pageInfo }, totals, suppliers] = await Promise.all([
    listPurchaseOrders(context.organization.id, query),
    purchaseOrderTotals(context.organization.id),
    supplierOptions(context.organization.id),
  ]);

  const can = {
    create: hasPermission(context.permissions, 'purchases.create'),
    edit: hasPermission(context.permissions, 'purchases.edit'),
    delete: hasPermission(context.permissions, 'purchases.delete'),
    export: hasPermission(context.permissions, 'purchases.export'),
    bill: hasPermission(context.permissions, 'bills.create'),
  };

  const currency = context.organization.currency;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase orders"
        description="What you have on order, and how much of it has actually arrived."
        actions={
          <>
            {can.export ? <ExportButton /> : null}
            {can.create ? (
              <Button size="sm" asChild>
                <Link href="/purchase-orders/new">
                  <Plus /> New order
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">
            On order
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={totals.openValue} kind="currency" currency={currency} decimals={2} />
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {totals.openCount} order{totals.openCount === 1 ? '' : 's'} still expected
          </p>
        </Card>
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">
            Received, not yet billed
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp
              value={totals.awaitingBillValue}
              kind="currency"
              currency={currency}
              decimals={2}
            />
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {totals.awaitingBillCount} order{totals.awaitingBillCount === 1 ? '' : 's'} to
            turn into bills
          </p>
        </Card>
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">Past due date</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={totals.overdueCount} decimals={0} />
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {totals.overdueCount === 0
              ? 'Everything is arriving on time'
              : 'Expected before today and still open'}
          </p>
        </Card>
      </div>

      <PurchaseOrdersTable
        rows={rows}
        pageInfo={pageInfo}
        isFiltered={Boolean(query.q) || Object.keys(query.filters).length > 0}
        currency={currency}
        suppliers={suppliers}
        can={can}
      />
    </div>
  );
}
