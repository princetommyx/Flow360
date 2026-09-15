import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared/page-header';
import { hasPermission } from '@/lib/permissions';
import { requirePermission } from '@/server/tenant';
import { listTaxRates, settingsFor } from '@/server/services/settings';

import { TaxSettingsForm } from './tax-settings-form';
import { TaxRatesCard } from './tax-rates-card';

export const metadata: Metadata = { title: 'Tax settings' };

export default async function TaxSettingsPage() {
  const context = await requirePermission('settings.view');

  const [settings, rates] = await Promise.all([
    settingsFor(context.organization.id),
    listTaxRates(context.organization.id),
  ]);

  const canEdit = hasPermission(context.permissions, 'settings.edit');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax"
        description="What the tax is called on your documents, and the rates you can pick from on a line."
      />

      <TaxSettingsForm
        canEdit={canEdit}
        defaultValues={{
          taxLabel: settings.taxLabel,
          defaultTaxRate: settings.defaultTaxRate,
          pricesIncludeTax: settings.pricesIncludeTax,
        }}
      />

      <TaxRatesCard canEdit={canEdit} rates={rates} taxLabel={settings.taxLabel} />
    </div>
  );
}
