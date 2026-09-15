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
import { EDITABLE_STATUSES, getBill } from '@/server/services/bills';
import { supplierOptions } from '@/server/services/purchase-orders';
import { productOptions } from '@/server/services/products';

import { BillForm } from '../../bill-form';

export const metadata: Metadata = { title: 'Edit bill' };

export default async function EditBillPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requirePermission('bills.edit');

  const bill = await getBill(context.organization.id, id);
  if (!bill) notFound();

  // An approved bill is a figure in your payables that other totals already
  // count; changing it in place would move those without a record of why.
  if (!EDITABLE_STATUSES.includes(bill.status)) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          title={`Bill ${bill.number}`}
          description="This bill is already in your payables."
        />
        <Alert variant="warning">
          <AlertDescription className="text-foreground">
            Only drafts can be edited. If the supplier has sent a corrected invoice,
            cancel this bill and record the new one, so both are on the record.
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link href={`/bills/${bill.id}`}>Back to the bill</Link>
        </Button>
      </div>
    );
  }

  const [suppliers, products, settings] = await Promise.all([
    supplierOptions(context.organization.id),
    productOptions(context.organization.id),
    db.companySettings.findUnique({
      where: { organizationId: context.organization.id },
      select: { taxLabel: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${bill.number}`}
        description="Still a draft, so everything on it can be changed."
      />
      <BillForm
        billId={bill.id}
        suppliers={suppliers}
        products={products.map((product) => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          unit: product.unit,
          sellingPrice: toNumber(product.purchasePrice),
          taxRate: toNumber(product.taxRate),
          stockQuantity: toNumber(product.stockQuantity),
          trackInventory: product.trackInventory,
          type: product.type,
        }))}
        currency={bill.currency}
        taxLabel={settings?.taxLabel ?? locale.taxLabel}
        linkedOrderNumber={bill.purchaseOrder?.number}
        defaultValues={{
          supplierId: bill.supplierId,
          purchaseOrderId: bill.purchaseOrderId,
          supplierRef: bill.supplierRef ?? '',
          issueDate: toDateInput(bill.issueDate),
          dueDate: toDateInput(bill.dueDate),
          notes: bill.notes ?? '',
          items: bill.items.map((item) => ({
            productId: item.productId,
            name: item.name,
            description: item.description ?? '',
            quantity: toNumber(item.quantity),
            unit: item.unit,
            unitPrice: toNumber(item.unitPrice),
            taxRate: toNumber(item.taxRate),
          })),
        }}
      />
    </div>
  );
}
