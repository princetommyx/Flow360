import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared/page-header';
import { requirePermission } from '@/server/tenant';
import { customerOptions } from '@/server/services/customers';

import { ProjectForm } from '../project-form';

export const metadata: Metadata = { title: 'Open a project' };

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const { customerId } = await searchParams;
  const context = await requirePermission('projects.create');

  const customers = await customerOptions(context.organization.id);
  const preselected = customerId
    ? customers.find((customer) => customer.id === customerId)
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Open a project"
        description="Tasks, hours and costs all hang off this, so what it has really cost stays visible."
      />
      <ProjectForm
        customers={customers.map((customer) => ({
          id: customer.id,
          label: customer.companyName ?? customer.name,
        }))}
        currency={context.organization.currency}
        defaultValues={preselected ? { customerId: preselected.id } : undefined}
      />
    </div>
  );
}
