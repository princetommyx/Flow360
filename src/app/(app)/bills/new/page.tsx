import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared/page-header';
import { db } from '@/lib/db';
import { locale } from '@/lib/config/brand';
import { toNumber } from '@/lib/money';
import { requirePermission } from '@/server/tenant';
import { getPurchaseOrder, supplierOptions } from '@/server/services/purchase-orders';
import { productOptions } from '@/server/services/products';

import { BillForm } from '../bill-form';

export const metadata: Metadata = { title: 'Record a bill' };

export default async function NewBillPage({
  searchParams,
}: {
  searchParams: Promise<{ purchaseOrderId?: string; supplierId?: string }>;
}) {
  const { purchaseOrderId, supplierId } = await searchParams;
  const context = await requirePermission('bills.create');

  const [suppliers, products, settings] = await Promise.all([
    supplierOptions(context.organization.id),
    productOptions(context.organization.id),
    db.companySettings.findUnique({
      where: { organizationId: context.organization.id },
      select: { taxLabel: true, defaultPaymentTermDays: true },
    }),
  ]);

  // An id from the query string is only honoured if it belongs to this tenant.
  const order = purchaseOrderId
    ? await getPurchaseOrder(context.organization.id, purchaseOrderId)
    : null;

  const preselectedSupplier = supplierId
    ? suppliers.find((supplier) => supplier.id === supplierId)
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Record a bill"
        description="What a supplier has invoiced you. Approving it adds the amount to what you owe."
      />
      <BillForm
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
        currency={context.organization.currency}
        taxLabel={settings?.taxLabel ?? locale.taxLabel}
        linkedOrderNumber={order?.number}
        defaultValues={
          order
            ? {
                supplierId: order.supplierId,
                purchaseOrderId: order.id,
                // The received quantity is what you should be billed for; the
                // supplier may still invoice differently, so it stays editable.
                items: order.items.map((item) => ({
                  productId: item.productId,
                  name: item.name,
                  description: item.description ?? '',
                  quantity:
                    toNumber(item.receivedQuantity) > 0
                      ? toNumber(item.receivedQuantity)
                      : toNumber(item.quantity),
                  unit: item.unit,
                  unitPrice: toNumber(item.unitPrice),
                  taxRate: toNumber(item.taxRate),
                })),
              }
            : preselectedSupplier
              ? { supplierId: preselectedSupplier.id }
              : undefined
        }
      />
    </div>
  );
}
