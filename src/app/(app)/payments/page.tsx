import type { Metadata } from 'next';

import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { ExportButton } from '@/components/shared/export-button';
import { CountUp } from '@/components/shared/count-up';
import { db } from '@/lib/db';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { hasPermission } from '@/lib/permissions';
import { requirePermission } from '@/server/tenant';
import { listPayments, paymentTotals } from '@/server/services/payments';
import { customerOptions } from '@/server/services/customers';

import { PaymentsTable } from './payments-table';

export const metadata: Metadata = { title: 'Payments' };

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const context = await requirePermission('payments.view');

  const query = parseListQuery(params, { sort: 'paidAt', dir: 'desc' });
  const [{ rows, pageInfo, summary }, totals, customers, accounts] = await Promise.all([
    listPayments(context.organization.id, query),
    paymentTotals(context.organization.id),
    customerOptions(context.organization.id),
    db.account.findMany({
      where: { organizationId: context.organization.id, deletedAt: null },
      orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
      select: { id: true, name: true },
    }),
  ]);

  const currency = context.organization.currency;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Every payment received, and which invoice it settled."
        actions={
          hasPermission(context.permissions, 'payments.export') ? (
            <ExportButton />
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">
            Received this month
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
            Matching this view
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={summary.received} kind="currency" currency={currency} decimals={2} />
          </p>
        </Card>
      </div>

      <PaymentsTable
        rows={rows}
        pageInfo={pageInfo}
        isFiltered={Boolean(query.q) || Object.keys(query.filters).length > 0}
        currency={currency}
        customers={customers.map((customer) => ({
          id: customer.id,
          name: customer.companyName ?? customer.name,
        }))}
        accounts={accounts}
        can={{ delete: hasPermission(context.permissions, 'payments.delete') }}
      />
    </div>
  );
}
