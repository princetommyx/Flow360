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
import { listQuotations, refreshExpiredQuotations } from '@/server/services/quotations';
import { customerOptions } from '@/server/services/customers';

import { QuotationsTable } from './quotations-table';

export const metadata: Metadata = { title: 'Quotations' };

export default async function QuotationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const context = await requirePermission('quotations.view');

  // Lapsing is a function of the date, not of anything anyone did, so it is
  // re-derived when the list is opened.
  await refreshExpiredQuotations(context.organization.id);

  const query = parseListQuery(params, { sort: 'issueDate', dir: 'desc' });
  const [{ rows, pageInfo, summary }, customers] = await Promise.all([
    listQuotations(context.organization.id, query),
    customerOptions(context.organization.id),
  ]);

  const can = {
    create: hasPermission(context.permissions, 'quotations.create'),
    edit: hasPermission(context.permissions, 'quotations.edit'),
    delete: hasPermission(context.permissions, 'quotations.delete'),
    export: hasPermission(context.permissions, 'quotations.export'),
    invoice: hasPermission(context.permissions, 'invoices.create'),
  };

  const currency = context.organization.currency;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotations"
        description="What you have offered, and which of it turned into work."
        actions={
          <>
            {can.export ? <ExportButton /> : null}
            {can.create ? (
              <Button size="sm" asChild>
                <Link href="/quotations/new">
                  <Plus /> New quotation
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">
            Quoted (matching this view)
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={summary.quoted} kind="currency" currency={currency} decimals={2} />
          </p>
        </Card>
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">
            Accepted (matching this view)
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={summary.won} kind="currency" currency={currency} decimals={2} />
          </p>
        </Card>
      </div>

      <QuotationsTable
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
