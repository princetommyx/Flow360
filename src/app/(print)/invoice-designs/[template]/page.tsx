import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PrintToolbar } from '@/components/shared/print-toolbar';
import { InvoiceDesign } from '@/components/invoice-templates';
import { db } from '@/lib/db';
import { entitledPlan } from '@/lib/config/plans';
import { findInvoiceTemplate, isTemplateAllowed } from '@/lib/config/invoice-templates';
import { addressLines } from '@/lib/invoice-document';
import { sampleInvoiceDocument } from '@/lib/invoice-sample';
import { requirePermission } from '@/server/tenant';
import { settingsFor } from '@/server/services/settings';

export const metadata: Metadata = { title: 'Invoice design' };

/**
 * One design at full size, on a made-up invoice.
 *
 * The thumbnails on the settings page are a third of an A4 sheet and cannot
 * settle an argument about whether the address block is right. This can: it is
 * the same components the real print route uses, at the size they print at, so
 * it can be sent to a printer and held.
 *
 * Only a design the plan includes will render. Otherwise this would be a
 * pleasant way to use the ones you have not bought.
 */
export default async function InvoiceDesignPreviewPage({
  params,
}: {
  params: Promise<{ template: string }>;
}) {
  const { template } = await params;
  const context = await requirePermission('settings.view');

  const design = findInvoiceTemplate(template);
  if (!design) notFound();

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

  if (!isTemplateAllowed(entitledPlan(organization), design.id)) notFound();

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

  return (
    <div className="min-h-dvh bg-muted/40 print:bg-white">
      <PrintToolbar backHref="/settings/invoice-design" backLabel="Back to designs" />
      <p className="print:hidden mx-auto mt-4 w-full max-w-[52rem] px-6 text-[12.5px] text-muted-foreground">
        A sample invoice in the <span className="font-medium text-foreground">{design.name}</span>{' '}
        design, with your own details on it. Nothing here is a real document.
      </p>
      <InvoiceDesign template={design.id} doc={doc} />
    </div>
  );
}
