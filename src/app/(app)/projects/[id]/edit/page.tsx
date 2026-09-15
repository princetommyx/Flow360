import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/shared/page-header';
import { toNumber } from '@/lib/money';
import { toDateInput } from '@/lib/date';
import { requirePermission } from '@/server/tenant';
import { getProject } from '@/server/services/projects';
import { customerOptions } from '@/server/services/customers';

import { ProjectForm } from '../../project-form';

export const metadata: Metadata = { title: 'Edit project' };

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requirePermission('projects.edit');

  const project = await getProject(context.organization.id, id);
  if (!project) notFound();

  const customers = await customerOptions(context.organization.id);

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit ${project.name}`} description={project.code} />
      <ProjectForm
        projectId={project.id}
        currency={project.currency}
        customers={customers.map((customer) => ({
          id: customer.id,
          label: customer.companyName ?? customer.name,
        }))}
        defaultValues={{
          name: project.name,
          code: project.code,
          customerId: project.customerId,
          description: project.description ?? '',
          status: project.status,
          startDate: toDateInput(project.startDate),
          endDate: project.endDate ? toDateInput(project.endDate) : '',
          budget: toNumber(project.budget),
          progress: project.progress,
        }}
      />
    </div>
  );
}
