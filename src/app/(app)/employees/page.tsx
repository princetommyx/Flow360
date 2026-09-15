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
  departmentOptions,
  employeeTotals,
  listEmployees,
} from '@/server/services/employees';

import { EmployeesTable } from './employees-table';

export const metadata: Metadata = { title: 'Employees' };

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const context = await requirePermission('employees.view');

  const query = parseListQuery(params, { sort: 'name', dir: 'asc' });
  const [{ rows, pageInfo }, totals, departments] = await Promise.all([
    listEmployees(context.organization.id, query),
    employeeTotals(context.organization.id),
    departmentOptions(context.organization.id),
  ]);

  const can = {
    create: hasPermission(context.permissions, 'employees.create'),
    edit: hasPermission(context.permissions, 'employees.edit'),
    delete: hasPermission(context.permissions, 'employees.delete'),
    export: hasPermission(context.permissions, 'employees.export'),
    payroll: hasPermission(context.permissions, 'payroll.create'),
  };

  const currency = context.organization.currency;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Who works for you, what they do, and what they are paid."
        actions={
          <>
            {can.export ? <ExportButton /> : null}
            {can.create ? (
              <Button size="sm" asChild>
                <Link href="/employees/new">
                  <Plus /> Add someone
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">On the team</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={totals.headcount} decimals={0} />
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {totals.onLeave > 0 ? `${totals.onLeave} on leave` : 'Nobody on leave'}
          </p>
        </Card>
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">
            Salary bill per period
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={totals.salaryBill} kind="currency" currency={currency} decimals={2} />
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Base pay for everyone still with you
          </p>
        </Card>
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">
            Started this month
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={totals.startedThisMonth} decimals={0} />
          </p>
        </Card>
      </div>

      <EmployeesTable
        rows={rows}
        pageInfo={pageInfo}
        isFiltered={Boolean(query.q) || Object.keys(query.filters).length > 0}
        currency={currency}
        departments={departments}
        can={can}
      />
    </div>
  );
}
