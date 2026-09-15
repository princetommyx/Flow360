import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared/page-header';
import { PLANS } from '@/lib/config/plans';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { requirePlatformAdmin } from '@/server/platform';
import { listOrganizations } from '@/server/services/platform';

import { OrganizationsTable } from './organizations-table';

export const metadata: Metadata = { title: 'Workspaces' };

export default async function OrganizationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requirePlatformAdmin();

  const params = await searchParams;
  const query = parseListQuery(params, { sort: 'createdAt', dir: 'desc', perPage: 25 });
  const list = await listOrganizations(query);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Workspaces"
        description="Every company on the platform. Open one to see its plan, its people and how much it holds."
      />

      <OrganizationsTable
        rows={list.rows}
        pageInfo={list.pageInfo}
        isFiltered={Boolean(query.q) || Object.keys(query.filters).length > 0}
        plans={PLANS.map((plan) => ({ value: plan.id, label: plan.name }))}
      />
    </div>
  );
}
