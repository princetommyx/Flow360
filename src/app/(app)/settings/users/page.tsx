import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared/page-header';
import { hasPermission } from '@/lib/permissions';
import { mailIsDelivered } from '@/lib/mailer';
import { requirePermission } from '@/server/tenant';
import { listMembers, listRoles } from '@/server/services/settings';

import { UsersList } from './users-list';

export const metadata: Metadata = { title: 'Users' };

export default async function UsersSettingsPage() {
  const context = await requirePermission('users.view');

  const [members, roles] = await Promise.all([
    listMembers(context.organization.id),
    listRoles(context.organization.id),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Who can get into this workspace, and what their role lets them do once they are in."
      />

      <UsersList
        members={members}
        roles={roles
          .filter((role) => role.key !== 'owner')
          .map((role) => ({ id: role.id, name: role.name, description: role.description }))}
        currentUserId={context.user.id}
        canInvite={hasPermission(context.permissions, 'users.create')}
        canEdit={hasPermission(context.permissions, 'users.edit')}
        canRemove={hasPermission(context.permissions, 'users.delete')}
        emailIsLive={mailIsDelivered()}
      />
    </div>
  );
}
