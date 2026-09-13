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
import { getInvoice } from '@/server/services/invoices';
import { customerOptions } from '@/server/services/customers';
import { productOptions } from '@/server/services/products';

import { InvoiceForm } from '../../invoice-form';

export const metadata: Metadata = { title: 'Edit invoice' };

export default async function EditInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requirePermission('invoices.edit');

  const invoice = await getInvoice(context.organization.id, id);
  if (!invoice) notFound();

  // A sent invoice is a document the customer already holds; editing it would
  // rewrite history and desynchronise stock.
  if (invoice.status !== 'DRAFT') {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          title={`Invoice ${invoice.number}`}
          description="This invoice has already been issued."
        />
        <Alert variant="warning">
          <AlertDescription className="text-foreground">
            Only drafts can be edited. To change the figures, duplicate this invoice
            and cancel the original so your records stay consistent.
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link href={`/invoices/${invoice.id}`}>Back to invoice</Link>
        </Button>
      </div>
    );
  }

  const [customers, products, settings] = await Promise.all([
    customerOptions(context.organization.id),
    productOptions(context.organization.id),
    db.companySettings.findUnique({
      where: { organizationId: context.organization.id },
      select: { taxLabel: true, defaultPaymentTermDays: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${invoice.number}`}
        description="Still a draft, so everything on it can be changed."
      />
      <InvoiceForm
        invoiceId={invoice.id}
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
        currency={invoice.currency}
        taxLabel={settings?.taxLabel ?? locale.taxLabel}
        defaultTermDays={settings?.defaultPaymentTermDays ?? 14}
        defaultNotes=""
        defaultTerms=""
        defaultValues={{
          customerId: invoice.customerId,
          issueDate: toDateInput(invoice.issueDate),
          dueDate: toDateInput(invoice.dueDate),
          reference: invoice.reference ?? '',
          discountType: invoice.discountType,
          discountValue: toNumber(invoice.discountValue),
          shippingAmount: toNumber(invoice.shippingAmount),
          notes: invoice.notes ?? '',
          terms: invoice.terms ?? '',
          projectId: invoice.projectId,
          items: invoice.items.map((item) => ({
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
