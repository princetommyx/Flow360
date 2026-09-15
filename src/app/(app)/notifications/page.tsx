import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared/page-header';
import { TabNav } from '@/components/shared/tab-nav';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { requireTenant } from '@/server/tenant';
import { listNotifications } from '@/server/services/notifications';

import { NotificationInbox } from './notification-inbox';

export const metadata: Metadata = { title: 'Notifications' };

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  // Your own inbox, so membership is the only requirement. There is no
  // `notifications.view` permission, and inventing one would lock people out
  // of alerts raised about their own work.
  const context = await requireTenant();
  const params = await searchParams;
  const query = parseListQuery(params, { perPage: 25 });

  const list = await listNotifications(context.organization.id, context.user.id, query);

  const tab = query.filters.tab ?? 'all';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Everything the workspace has raised for you, newest first."
      />

      <TabNav
        active={tab}
        tabs={[
          { value: 'all', label: 'All', count: list.total },
          { value: 'unread', label: 'Unread', count: list.unread },
          { value: 'read', label: 'Read', count: list.total - list.unread },
        ]}
      />

      <NotificationInbox list={list} unread={list.unread} />
    </div>
  );
}
