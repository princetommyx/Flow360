import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared/page-header';
import { hasPermission } from '@/lib/permissions';
import { requirePermission } from '@/server/tenant';
import { settingsFor } from '@/server/services/settings';

import { NotificationsForm } from './notifications-form';

export const metadata: Metadata = { title: 'Notification settings' };

export default async function NotificationSettingsPage() {
  const context = await requirePermission('settings.view');
  const settings = await settingsFor(context.organization.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Which events are worth interrupting someone for."
      />

      <NotificationsForm
        canEdit={hasPermission(context.permissions, 'settings.edit')}
        defaultValues={{
          notifyOnInvoicePaid: settings.notifyOnInvoicePaid,
          notifyOnQuoteAccepted: settings.notifyOnQuoteAccepted,
          notifyOnOverdue: settings.notifyOnOverdue,
          notifyOnLowStock: settings.notifyOnLowStock,
          lowStockAlerts: settings.lowStockAlerts,
        }}
      />
    </div>
  );
}
