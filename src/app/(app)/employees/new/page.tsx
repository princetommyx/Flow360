import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared/page-header';
import { requirePermission } from '@/server/tenant';

import { EmployeeForm } from '../employee-form';

export const metadata: Metadata = { title: 'Add someone' };

export default async function NewEmployeePage() {
  const context = await requirePermission('employees.create');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add someone to the team"
        description="Their payslips, attendance and timesheets all hang off this record."
      />
      <EmployeeForm currency={context.organization.currency} />
    </div>
  );
}
