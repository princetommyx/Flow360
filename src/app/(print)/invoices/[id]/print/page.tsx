import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PrintToolbar } from '@/components/shared/print-toolbar';
import { InvoiceDesign } from '@/components/invoice-templates';
import { db } from '@/lib/db';
import { entitledPlan } from '@/lib/config/plans';
import { resolveInvoiceTemplate } from '@/lib/config/invoice-templates';
import { toInvoiceDocument } from '@/lib/invoice-document';
import { requirePermission } from '@/server/tenant';
import { getInvoice } from '@/server/services/invoices';

export const metadata: Metadata = { title: 'Print invoice' };

/**
 * The printable invoice.
 *
 * This page decides nothing about how the invoice looks: it loads the
 * document, works out which design the workspace is entitled to print it with,
 * and hands both over. A design chosen on a plan the workspace has since left
 * falls back to the default here rather than refusing to print — the argument
 * about the plan belongs on the settings page, not between somebody and their
 * invoice.
 */
export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requirePermission('invoices.view');

  const [invoice, organization, settings] = await Promise.all([
    getInvoice(context.organization.id, id),
    db.organization.findUnique({
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
        plan: true,
        trialEndsAt: true,
        subscriptionStatus: true,
      },
    }),
    db.companySettings.findUnique({
      where: { organizationId: context.organization.id },
      select: {
        paymentInstructions: true,
        invoiceFooter: true,
        taxLabel: true,
        invoiceTemplate: true,
      },
    }),
  ]);

  if (!invoice || !organization) notFound();

  const design = resolveInvoiceTemplate(
    settings?.invoiceTemplate,
    entitledPlan(organization),
  );

  return (
    <div className="min-h-dvh bg-muted/40 print:bg-white">
      <PrintToolbar backHref={`/invoices/${invoice.id}`} backLabel="Back to invoice" />
      <InvoiceDesign
        template={design.id}
        doc={toInvoiceDocument(invoice, organization, settings)}
      />
    </div>
  );
}
