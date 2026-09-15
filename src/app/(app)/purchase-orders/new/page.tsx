import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared/page-header';
import { db } from '@/lib/db';
import { locale } from '@/lib/config/brand';
import { toNumber } from '@/lib/money';
import { requirePermission } from '@/server/tenant';
import { supplierOptions } from '@/server/services/purchase-orders';
import { productOptions } from '@/server/services/products';

import { PurchaseOrderForm } from '../purchase-order-form';

export const metadata: Metadata = { title: 'New purchase order' };

export default async function NewPurchaseOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ supplierId?: string }>;
}) {
  const { supplierId } = await searchParams;
  const context = await requirePermission('purchases.create');

  const [suppliers, products, settings] = await Promise.all([
    supplierOptions(context.organization.id),
    productOptions(context.organization.id),
    db.companySettings.findUnique({
      where: { organizationId: context.organization.id },
      select: { taxLabel: true },
    }),
  ]);

  // A supplierId from the query string is only honoured if it belongs here.
  const preselected = supplierId
    ? suppliers.find((supplier) => supplier.id === supplierId)
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader
        title="New purchase order"
        description="Commit to what you are buying. Stock only moves when you record the delivery against it."
      />
      <PurchaseOrderForm
        suppliers={suppliers}
        products={products.map((product) => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          unit: product.unit,
          // Ordering is priced at what you pay, not what you charge.
          sellingPrice: toNumber(product.purchasePrice),
          taxRate: toNumber(product.taxRate),
          stockQuantity: toNumber(product.stockQuantity),
          trackInventory: product.trackInventory,
          type: product.type,
        }))}
        currency={context.organization.currency}
        taxLabel={settings?.taxLabel ?? locale.taxLabel}
        defaultValues={preselected ? { supplierId: preselected.id } : undefined}
      />
    </div>
  );
}
