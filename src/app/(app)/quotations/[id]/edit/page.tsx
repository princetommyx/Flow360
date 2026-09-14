import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { db } from '@/lib/db';
import { locale } from '@/lib/config/brand';
import { toNumber } from '@/lib/money';
import { toDateInput } from '@/lib/date';
import { requirePermission } from '@/server/tenant';
import { getQuotation } from '@/server/services/quotations';
import { customerOptions } from '@/server/services/customers';
import { productOptions } from '@/server/services/products';

import { QuotationForm } from '../../quotation-form';

export const metadata: Metadata = { title: 'Edit quotation' };

export default async function EditQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requirePermission('quotations.edit');

  const quotation = await getQuotation(context.organization.id, id);
  if (!quotation) notFound();

  // A sent quotation is a price the customer is holding you to; editing it in
  // place would change what they were shown with no record of it.
  if (quotation.status !== 'DRAFT') {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          title={`Quotation ${quotation.number}`}
          description="This quotation has already gone out."
        />
        <Alert variant="warning">
          <AlertDescription className="text-foreground">
            Only drafts can be edited. To change the figures, duplicate this quotation
            and send the copy, so the customer can see what changed.
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link href={`/quotations/${quotation.id}`}>Back to quotation</Link>
        </Button>
      </div>
    );
  }

  const [customers, products, settings] = await Promise.all([
    customerOptions(context.organization.id),
    productOptions(context.organization.id),
    db.companySettings.findUnique({
      where: { organizationId: context.organization.id },
      select: { taxLabel: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${quotation.number}`}
        description="Still a draft, so everything on it can be changed."
      />
      <QuotationForm
        quotationId={quotation.id}
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
        currency={quotation.currency}
        taxLabel={settings?.taxLabel ?? locale.taxLabel}
        defaultNotes=""
        defaultTerms=""
        defaultValues={{
          customerId: quotation.customerId,
          issueDate: toDateInput(quotation.issueDate),
          expiryDate: toDateInput(quotation.expiryDate),
          discountType: quotation.discountType,
          discountValue: toNumber(quotation.discountValue),
          notes: quotation.notes ?? '',
          terms: quotation.terms ?? '',
          items: quotation.items.map((item) => ({
            productId: item.productId,
            name: item.name,
            description: item.description ?? '',
            quantity: toNumber(item.quantity),
            unit: item.unit,
            unitPrice: toNumber(item.unitPrice),
            discountRate: toNumber(item.discountRate),
            taxRate: toNumber(item.taxRate),
          })),
        }}
      />
    </div>
  );
}
