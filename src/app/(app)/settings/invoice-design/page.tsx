import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared/page-header';
import { hasPermission } from '@/lib/permissions';
import { db } from '@/lib/db';
import { entitledPlan, findPlan } from '@/lib/config/plans';
import {
  INVOICE_TEMPLATES,
  isTemplateAllowed,
  resolveInvoiceTemplate,
} from '@/lib/config/invoice-templates';
import { addressLines } from '@/lib/invoice-document';
import { sampleInvoiceDocument } from '@/lib/invoice-sample';
import { requirePermission } from '@/server/tenant';
import { settingsFor } from '@/server/services/settings';

import { DesignPicker } from './design-picker';

export const metadata: Metadata = { title: 'Invoice design' };

/**
 * Choosing what an invoice looks like.
 *
 * The previews are the workspace's own details on a made-up invoice, because
 * the question being asked is "how does *my* invoice look", and a preview full
 * of somebody else's address cannot answer it.
 */
export default async function InvoiceDesignSettingsPage() {
  const context = await requirePermission('settings.view');

  const [organization, settings] = await Promise.all([
    db.organization.findUniqueOrThrow({
      where: { id: context.organization.id },
      select: {
        name: true,
        legalName: true,
        email: true,
        phone: true,
        website: true,
        taxId: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        currency: true,
        plan: true,
        trialEndsAt: true,
        subscriptionStatus: true,
      },
    }),
    settingsFor(context.organization.id),
  ]);

  const plan = entitledPlan(organization);
  const inUse = resolveInvoiceTemplate(settings.invoiceTemplate, plan);

  const doc = sampleInvoiceDocument({
    currency: organization.currency,
    taxLabel: settings.taxLabel,
    paymentInstructions: settings.paymentInstructions || null,
    footer: settings.invoiceFooter || null,
    seller: {
      name: organization.name,
      companyName: organization.legalName,
      addressLines: addressLines(organization),
      taxId: organization.taxId,
      email: organization.email,
      phone: organization.phone,
      website: organization.website,
    },
  });

  /*
    Flattened here rather than in the picker: what a plan includes is a server
    question, and sending plain rows means the client component never has to
    work it out — or be trusted to.
  */
  const designs = INVOICE_TEMPLATES.map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    allowed: isTemplateAllowed(plan, template.id),
    planName: findPlan(template.plan)?.name ?? template.plan,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoice design"
        description="How your invoices look on paper and as a PDF. The figures are the same on every one of them."
      />

      <DesignPicker
        designs={designs}
        doc={doc}
        stored={settings.invoiceTemplate}
        inUse={inUse.id}
        planName={findPlan(plan)?.name ?? plan}
        canEdit={hasPermission(context.permissions, 'settings.edit')}
      />
    </div>
  );
}
