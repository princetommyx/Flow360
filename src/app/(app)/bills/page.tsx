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
import { billTotals, listBills, refreshOverdueBills } from '@/server/services/bills';
import { supplierOptions } from '@/server/services/purchase-orders';

import { BillsTable } from './bills-table';

export const metadata: Metadata = { title: 'Bills' };

export default async function BillsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const context = await requirePermission('bills.view');

  // Lateness is a function of the date, not of anything anyone did, so it is
  // re-derived when the list is opened.
  await refreshOverdueBills(context.organization.id);

  const query = parseListQuery(params, { sort: 'issueDate', dir: 'desc' });
  const [{ rows, pageInfo }, totals, suppliers] = await Promise.all([
    listBills(context.organization.id, query),
    billTotals(context.organization.id),
    supplierOptions(context.organization.id),
  ]);

  const can = {
    create: hasPermission(context.permissions, 'bills.create'),
    edit: hasPermission(context.permissions, 'bills.edit'),
    delete: hasPermission(context.permissions, 'bills.delete'),
    export: hasPermission(context.permissions, 'bills.export'),
    pay: hasPermission(context.permissions, 'payments.create'),
  };

  const currency = context.organization.currency;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bills"
        description="What your suppliers have invoiced you, and what is still to pay."
        actions={
          <>
            {can.export ? <ExportButton /> : null}
            {can.create ? (
              <Button size="sm" asChild>
                <Link href="/bills/new">
                  <Plus /> Record a bill
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">Owed in total</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={totals.owed} kind="currency" currency={currency} decimals={2} />
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {totals.owedCount} bill{totals.owedCount === 1 ? '' : 's'} outstanding
          </p>
        </Card>
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">Overdue</p>
          <p
            className={
              totals.overdue > 0
                ? 'mt-2 text-2xl font-semibold tracking-[-0.02em] tabular text-destructive'
                : 'mt-2 text-2xl font-semibold tracking-[-0.02em] tabular'
            }
          >
            <CountUp value={totals.overdue} kind="currency" currency={currency} decimals={2} />
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {totals.overdueCount === 0
              ? 'Nothing is late'
              : `${totals.overdueCount} past the due date`}
          </p>
        </Card>
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">Due this week</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={totals.dueSoon} kind="currency" currency={currency} decimals={2} />
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {totals.dueSoonCount} bill{totals.dueSoonCount === 1 ? '' : 's'} in the next
            seven days
          </p>
        </Card>
      </div>

      <BillsTable
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
