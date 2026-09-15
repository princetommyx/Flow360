import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { toNumber } from '@/lib/money';
import { toDateInput } from '@/lib/date';
import { requirePermission } from '@/server/tenant';
import { EDITABLE_STATUSES, getPayroll } from '@/server/services/payroll';
import { employeeOptions } from '@/server/services/employees';

import { PayrollForm } from '../../payroll-form';

export const metadata: Metadata = { title: 'Edit payslip' };

export default async function EditPayrollPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requirePermission('payroll.edit');

  const payroll = await getPayroll(context.organization.id, id);
  if (!payroll) notFound();

  // An approved payslip is a figure someone has been told they are getting.
  if (!EDITABLE_STATUSES.includes(payroll.status)) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          title={`Payslip ${payroll.number}`}
          description="This payslip has already been approved."
        />
        <Alert variant="warning">
          <AlertDescription className="text-foreground">
            Only drafts can be changed. An approved payslip is a figure someone has
            been told they are getting. Cancel this one and prepare another if the
            numbers were wrong, so both are on the record.
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link href={`/payroll/${payroll.id}`}>Back to the payslip</Link>
        </Button>
      </div>
    );
  }

  const employees = await employeeOptions(context.organization.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${payroll.number}`}
        description={`For ${payroll.employee.firstName} ${payroll.employee.lastName}.`}
      />
      <PayrollForm
        payrollId={payroll.id}
        employees={employees}
        currency={payroll.currency}
        defaultValues={{
          employeeId: payroll.employeeId,
          periodStart: toDateInput(payroll.periodStart),
          periodEnd: toDateInput(payroll.periodEnd),
          baseSalary: toNumber(payroll.baseSalary),
          allowances: toNumber(payroll.allowances),
          overtime: toNumber(payroll.overtime),
          bonus: toNumber(payroll.bonus),
          taxDeduction: toNumber(payroll.taxDeduction),
          otherDeduction: toNumber(payroll.otherDeduction),
          notes: payroll.notes ?? '',
        }}
      />
    </div>
  );
}
