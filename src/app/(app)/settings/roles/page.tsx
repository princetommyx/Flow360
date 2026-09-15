import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared/page-header';
import { hasPermission } from '@/lib/permissions';
import { requirePermission } from '@/server/tenant';
import { listRoles } from '@/server/services/settings';

import { RolesManager } from './roles-manager';

export const metadata: Metadata = { title: 'Roles and permissions' };

export default async function RolesSettingsPage() {
  const context = await requirePermission('users.view');
  const roles = await listRoles(context.organization.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles and permissions"
        description="A role is a list of things someone may do. Every page and every action checks it on the server, so what is switched off here is genuinely off."
      />

      <RolesManager
        roles={roles}
        canCreate={hasPermission(context.permissions, 'users.create')}
        canEdit={hasPermission(context.permissions, 'users.edit')}
        canDelete={hasPermission(context.permissions, 'users.delete')}
      />
    </div>
  );
}
