import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/shared/page-header';
import { requirePermission } from '@/server/tenant';
import {
  categoryOptions,
  getProduct,
  supplierOptions,
} from '@/server/services/products';
import { toNumber } from '@/lib/money';

import { ProductForm } from '../../product-form';

export const metadata: Metadata = { title: 'Edit product' };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requirePermission('products.edit');

  const [product, categories, suppliers] = await Promise.all([
    getProduct(context.organization.id, id),
    categoryOptions(context.organization.id),
    supplierOptions(context.organization.id),
  ]);

  if (!product) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={`Edit ${product.name}`}
        description="Stock levels are changed through an adjustment so every movement is recorded."
      />
      <ProductForm
        productId={product.id}
        categories={categories}
        suppliers={suppliers.map((supplier) => ({
          id: supplier.id,
          name: supplier.companyName ?? supplier.name,
        }))}
        currency={context.organization.currency}
        defaultValues={{
          name: product.name,
          sku: product.sku,
          barcode: product.barcode ?? '',
          description: product.description ?? '',
          type: product.type,
          categoryId: product.categoryId,
          supplierId: product.supplierId,
          unit: product.unit,
          purchasePrice: toNumber(product.purchasePrice),
          sellingPrice: toNumber(product.sellingPrice),
          taxRate: toNumber(product.taxRate),
          stockQuantity: toNumber(product.stockQuantity),
          minStockLevel: toNumber(product.minStockLevel),
          trackInventory: product.trackInventory,
          status: product.status,
        }}
      />
    </div>
  );
}
