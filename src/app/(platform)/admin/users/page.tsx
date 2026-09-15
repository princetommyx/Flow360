import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared/page-header';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { requirePlatformAdmin } from '@/server/platform';
import { listPlatformUsers } from '@/server/services/platform';

import { PeopleTable } from './people-table';

export const metadata: Metadata = { title: 'People' };

export default async function PlatformUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const context = await requirePlatformAdmin();

  const params = await searchParams;
  const query = parseListQuery(params, { perPage: 25 });
  const list = await listPlatformUsers(query);

  return (
    <div className="space-y-6">
      <PageHeader
        title="People"
        description="Every account on the platform, across every workspace. This is where you look when somebody cannot get in."
      />

      <PeopleTable
        rows={list.rows}
        pageInfo={list.pageInfo}
        currentUserId={context.user.id}
        isFiltered={Boolean(query.q) || Object.keys(query.filters).length > 0}
      />
    </div>
  );
}
