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
import { listPayroll, payrollTotals } from '@/server/services/payroll';
import { employeeOptions } from '@/server/services/employees';

import { PayrollTable } from './payroll-table';

export const metadata: Metadata = { title: 'Payroll' };

export default async function PayrollPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const context = await requirePermission('payroll.view');

  const query = parseListQuery(params, { sort: 'periodStart', dir: 'desc' });
  const [{ rows, pageInfo }, totals, employees] = await Promise.all([
    listPayroll(context.organization.id, query),
    payrollTotals(context.organization.id),
    employeeOptions(context.organization.id),
  ]);

  const can = {
    create: hasPermission(context.permissions, 'payroll.create'),
    edit: hasPermission(context.permissions, 'payroll.edit'),
    delete: hasPermission(context.permissions, 'payroll.delete'),
    export: hasPermission(context.permissions, 'payroll.export'),
  };

  const currency = context.organization.currency;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        description="What each person takes home, and what is still to pay out."
        actions={
          <>
            {can.export ? <ExportButton /> : null}
            {can.create ? (
              <Button size="sm" asChild>
                <Link href="/payroll/new">
                  <Plus /> Prepare a payslip
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">
            Approved, awaiting payment
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={totals.pending} kind="currency" currency={currency} decimals={2} />
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {totals.pendingCount} payslip{totals.pendingCount === 1 ? '' : 's'} ready to pay
          </p>
        </Card>
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">
            Paid this month
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={totals.paidThisMonth} kind="currency" currency={currency} decimals={2} />
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Across {totals.paidCount} payslip{totals.paidCount === 1 ? '' : 's'}
          </p>
        </Card>
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">
            Still in draft
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={totals.draftCount} decimals={0} />
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            {totals.draftCount === 0 ? 'Nothing waiting on you' : 'Not yet approved'}
          </p>
        </Card>
      </div>

      <PayrollTable
        rows={rows}
        pageInfo={pageInfo}
        isFiltered={Boolean(query.q) || Object.keys(query.filters).length > 0}
        currency={currency}
        employees={employees.map((employee) => ({
          id: employee.id,
          name: employee.name,
        }))}
        can={can}
      />
    </div>
  );
}
