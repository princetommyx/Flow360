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
import { listProjects, projectTotals } from '@/server/services/projects';
import { customerOptions } from '@/server/services/customers';

import { ProjectsTable } from './projects-table';

export const metadata: Metadata = { title: 'Projects' };

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const context = await requirePermission('projects.view');

  const query = parseListQuery(params, { sort: 'startDate', dir: 'desc' });
  const [{ rows, pageInfo }, totals, customers] = await Promise.all([
    listProjects(context.organization.id, query),
    projectTotals(context.organization.id),
    customerOptions(context.organization.id),
  ]);

  const can = {
    create: hasPermission(context.permissions, 'projects.create'),
    edit: hasPermission(context.permissions, 'projects.edit'),
    delete: hasPermission(context.permissions, 'projects.delete'),
    export: hasPermission(context.permissions, 'projects.export'),
  };

  const currency = context.organization.currency;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="The work in flight, what it was budgeted at, and what it has cost so far."
        actions={
          <>
            {can.export ? <ExportButton /> : null}
            {can.create ? (
              <Button size="sm" asChild>
                <Link href="/projects/new">
                  <Plus /> Open a project
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">Running</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={totals.openCount} decimals={0} />
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Planning, active or on hold
          </p>
        </Card>
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">Budgeted</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={totals.budget} kind="currency" currency={currency} decimals={2} />
          </p>
        </Card>
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">Spent</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={totals.spent} kind="currency" currency={currency} decimals={2} />
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            From billable hours booked
          </p>
        </Card>
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">Over budget</p>
          <p
            className={
              totals.overBudgetCount > 0
                ? 'mt-2 text-2xl font-semibold tracking-[-0.02em] tabular text-destructive'
                : 'mt-2 text-2xl font-semibold tracking-[-0.02em] tabular'
            }
          >
            <CountUp value={totals.overBudgetCount} decimals={0} />
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {totals.overBudgetCount === 0
              ? 'All within budget'
              : 'Costing more than planned'}
          </p>
        </Card>
      </div>

      <ProjectsTable
        rows={rows}
        pageInfo={pageInfo}
        isFiltered={Boolean(query.q) || Object.keys(query.filters).length > 0}
        currency={currency}
        customers={customers.map((customer) => ({
          id: customer.id,
          label: customer.companyName ?? customer.name,
        }))}
        can={can}
      />
    </div>
  );
}
