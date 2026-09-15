import type { Metadata } from 'next';
import Link from 'next/link';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { requirePermission } from '@/server/tenant';
import { employeeOptions } from '@/server/services/employees';

import { PayrollForm } from '../payroll-form';

export const metadata: Metadata = { title: 'Prepare a payslip' };

export default async function NewPayrollPage({
  searchParams,
}: {
  searchParams: Promise<{ employeeId?: string }>;
}) {
  const { employeeId } = await searchParams;
  const context = await requirePermission('payroll.create');

  const employees = await employeeOptions(context.organization.id);

  if (employees.length === 0) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          title="Prepare a payslip"
          description="There is nobody to pay yet."
        />
        <Alert>
          <AlertDescription className="text-foreground">
            Payslips are prepared against the people on your team, so add someone
            first. Their contracted pay then comes through as the starting figure.
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link href="/employees/new">Add someone to the team</Link>
        </Button>
      </div>
    );
  }

  // An id from the query string is only honoured if it belongs to this tenant.
  const preselected = employeeId
    ? employees.find((employee) => employee.id === employeeId)
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prepare a payslip"
        description="Take-home is worked out from the figures you enter. It is never typed in directly."
      />
      <PayrollForm
        employees={employees}
        currency={context.organization.currency}
        defaultValues={
          preselected
            ? { employeeId: preselected.id, baseSalary: preselected.baseSalary }
            : undefined
        }
      />
    </div>
  );
}
