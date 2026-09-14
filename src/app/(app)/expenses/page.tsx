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
  expenseCategoryOptions,
  expenseTotals,
  listExpenses,
} from '@/server/services/expenses';
import { supplierOptions } from '@/server/services/suppliers';

import { ExpensesTable } from './expenses-table';

export const metadata: Metadata = { title: 'Expenses' };

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const context = await requirePermission('expenses.view');
  const currency = context.organization.currency;

  const query = parseListQuery(params, { sort: 'spentAt', dir: 'desc' });
  const [{ rows, pageInfo, summary }, totals, categories, suppliers] = await Promise.all([
    listExpenses(context.organization.id, query),
    expenseTotals(context.organization.id),
    expenseCategoryOptions(context.organization.id),
    supplierOptions(context.organization.id),
  ]);

  const can = {
    create: hasPermission(context.permissions, 'expenses.create'),
    edit: hasPermission(context.permissions, 'expenses.edit'),
    delete: hasPermission(context.permissions, 'expenses.delete'),
    export: hasPermission(context.permissions, 'expenses.export'),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="What the business spends, and on what."
        actions={
          <>
            {can.export ? <ExportButton /> : null}
            {can.create ? (
              <Button size="sm" asChild>
                <Link href="/expenses/new">
                  <Plus /> Record expense
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">
            Spent this month
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={totals.thisMonth} kind="currency" currency={currency} decimals={2} />
          </p>
        </Card>
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">Last month</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={totals.lastMonth} kind="currency" currency={currency} decimals={2} />
          </p>
        </Card>
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">
            {totals.topCategory
              ? `Biggest this month · ${totals.topCategory.name}`
              : 'Matching this view'}
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp
              value={totals.topCategory ? totals.topCategory.total : summary.spent}
              kind="currency"
              currency={currency}
              decimals={2}
            />
          </p>
        </Card>
      </div>

      <ExpensesTable
        rows={rows}
        pageInfo={pageInfo}
        isFiltered={Boolean(query.q) || Object.keys(query.filters).length > 0}
        currency={currency}
        categories={categories}
        suppliers={suppliers.map((supplier) => ({
          id: supplier.id,
          name: supplier.companyName ?? supplier.name,
        }))}
        can={can}
      />
    </div>
  );
}
