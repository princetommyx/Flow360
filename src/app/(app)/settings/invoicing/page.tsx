import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared/page-header';
import { hasPermission } from '@/lib/permissions';
import { requirePermission } from '@/server/tenant';
import { settingsFor } from '@/server/services/settings';

import { InvoicingForm } from './invoicing-form';

export const metadata: Metadata = { title: 'Invoice settings' };

export default async function InvoicingSettingsPage() {
  const context = await requirePermission('settings.view');
  const settings = await settingsFor(context.organization.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoicing"
        description="How your documents are numbered, and the wording that appears on every one of them."
      />

      <InvoicingForm
        canEdit={hasPermission(context.permissions, 'settings.edit')}
        defaultValues={{
          invoicePrefix: settings.invoicePrefix,
          quotationPrefix: settings.quotationPrefix,
          paymentPrefix: settings.paymentPrefix,
          purchaseOrderPrefix: settings.purchaseOrderPrefix,
          numberPadding: settings.numberPadding,
          numberIncludeYear: settings.numberIncludeYear,
          defaultPaymentTermDays: settings.defaultPaymentTermDays,
          defaultInvoiceNotes: settings.defaultInvoiceNotes,
          paymentInstructions: settings.paymentInstructions,
          invoiceFooter: settings.invoiceFooter,
        }}
      />
    </div>
  );
}
