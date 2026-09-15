import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared/page-header';
import { db } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { toNumber } from '@/lib/money';
import { requirePermission } from '@/server/tenant';

import { CompanyForm } from './company-form';
import { CurrencyCard } from './currency-card';

export const metadata: Metadata = { title: 'Company' };

export default async function CompanySettingsPage() {
  const context = await requirePermission('settings.view');

  const [organization, biggestInvoice] = await Promise.all([
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
        industry: true,
        currency: true,
      },
    }),
    // A real figure from these books makes the conversion preview something
    // the reader recognises rather than an abstract example.
    db.invoice.findFirst({
      where: { organizationId: context.organization.id, deletedAt: null },
      orderBy: { total: 'desc' },
      select: { number: true, total: true },
    }),
  ]);

  const canEdit = hasPermission(context.permissions, 'settings.edit');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company"
        description="Who you are on paper, and the currency your books are kept in."
      />

      <CompanyForm
        canEdit={canEdit}
        defaultValues={{
          name: organization.name,
          legalName: organization.legalName ?? '',
          email: organization.email ?? '',
          phone: organization.phone ?? '',
          website: organization.website ?? '',
          taxId: organization.taxId ?? '',
          addressLine1: organization.addressLine1 ?? '',
          addressLine2: organization.addressLine2 ?? '',
          city: organization.city ?? '',
          state: organization.state ?? '',
          postalCode: organization.postalCode ?? '',
          country: organization.country ?? '',
          industry: organization.industry ?? '',
        }}
      />

      <CurrencyCard
        workspaceName={organization.name}
        current={organization.currency}
        isOwner={context.membership.isOwner}
        sample={
          biggestInvoice
            ? {
                label: `Invoice ${biggestInvoice.number}`,
                amount: toNumber(biggestInvoice.total),
              }
            : null
        }
      />
    </div>
  );
}
