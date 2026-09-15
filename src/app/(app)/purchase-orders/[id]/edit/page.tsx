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
import {
  EDITABLE_STATUSES,
  getPurchaseOrder,
  supplierOptions,
} from '@/server/services/purchase-orders';
import { productOptions } from '@/server/services/products';

import { PurchaseOrderForm } from '../../purchase-order-form';

export const metadata: Metadata = { title: 'Edit purchase order' };

export default async function EditPurchaseOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requirePermission('purchases.edit');

  const order = await getPurchaseOrder(context.organization.id, id);
  if (!order) notFound();

  // Once goods start arriving the lines are tied to stock movements that
  // already happened; rewriting them would leave the ledger describing an
  // order that no longer exists.
  if (!EDITABLE_STATUSES.includes(order.status)) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          title={`Purchase order ${order.number}`}
          description="This order has moved past the point where it can be edited."
        />
        <Alert variant="warning">
          <AlertDescription className="text-foreground">
            Only draft and sent orders can be changed. Cancel this one and raise a
            replacement if the supplier has agreed to something different — the stock
            already received against it stays where it is.
          </AlertDescription>
        </Alert>
        <Button asChild>
          <Link href={`/purchase-orders/${order.id}`}>Back to the order</Link>
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
        title={`Edit ${order.number}`}
        description="Nothing has been received yet, so every line can still be changed."
      />
      <PurchaseOrderForm
        purchaseOrderId={order.id}
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
        currency={order.currency}
        taxLabel={settings?.taxLabel ?? locale.taxLabel}
        defaultValues={{
          supplierId: order.supplierId,
          orderDate: toDateInput(order.orderDate),
          expectedDate: order.expectedDate ? toDateInput(order.expectedDate) : '',
          discountAmount: toNumber(order.discountAmount),
          notes: order.notes ?? '',
          items: order.items.map((item) => ({
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
