import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/shared/page-header';
import { toNumber } from '@/lib/money';
import { toDateInput } from '@/lib/date';
import { requirePermission } from '@/server/tenant';
import { getEmployee } from '@/server/services/employees';

import { EmployeeForm } from '../../employee-form';

export const metadata: Metadata = { title: 'Edit employee' };

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requirePermission('employees.edit');

  const employee = await getEmployee(context.organization.id, id);
  if (!employee) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${employee.firstName} ${employee.lastName}`}
        description={`Employee ${employee.employeeNumber}.`}
      />
      <EmployeeForm
        employeeId={employee.id}
        currency={employee.currency}
        defaultValues={{
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phone: employee.phone ?? '',
          department: employee.department ?? '',
          position: employee.position ?? '',
          employmentType: employee.employmentType,
          status: employee.status,
          hiredAt: toDateInput(employee.hiredAt),
          terminatedAt: employee.terminatedAt ? toDateInput(employee.terminatedAt) : '',
          baseSalary: toNumber(employee.baseSalary),
          addressLine1: employee.addressLine1 ?? '',
          city: employee.city ?? '',
          country: employee.country ?? '',
          bankAccount: employee.bankAccount ?? '',
          taxNumber: employee.taxNumber ?? '',
          notes: employee.notes ?? '',
        }}
      />
    </div>
  );
}
