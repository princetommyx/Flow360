import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared/page-header';
import { db } from '@/lib/db';
import { locale } from '@/lib/config/brand';
import { toNumber } from '@/lib/money';
import { requirePermission } from '@/server/tenant';
import { customerOptions } from '@/server/services/customers';
import { productOptions } from '@/server/services/products';

import { QuotationForm } from '../quotation-form';

export const metadata: Metadata = { title: 'New quotation' };

export default async function NewQuotationPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  const { customerId } = await searchParams;
  const context = await requirePermission('quotations.create');

  const [customers, products, settings] = await Promise.all([
    customerOptions(context.organization.id),
    productOptions(context.organization.id),
    db.companySettings.findUnique({
      where: { organizationId: context.organization.id },
      select: { defaultInvoiceNotes: true, invoiceFooter: true, taxLabel: true },
    }),
  ]);

  // A customerId from the query string is only honoured if it belongs here.
  const preselected = customerId
    ? customers.find((customer) => customer.id === customerId)
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="New quotation"
        description="Price the work here. Nothing is committed until the customer accepts and you turn it into an invoice."
      />
      <QuotationForm
        customers={customers}
        products={products.map((product) => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          unit: product.unit,
          sellingPrice: toNumber(product.sellingPrice),
          taxRate: toNumber(product.taxRate),
          stockQuantity: toNumber(product.stockQuantity),
          trackInventory: product.trackInventory,
          type: product.type,
        }))}
        currency={context.organization.currency}
        taxLabel={settings?.taxLabel ?? locale.taxLabel}
        defaultNotes={settings?.defaultInvoiceNotes ?? ''}
        defaultTerms={settings?.invoiceFooter ?? ''}
        defaultValues={preselected ? { customerId: preselected.id } : undefined}
      />
    </div>
  );
}
