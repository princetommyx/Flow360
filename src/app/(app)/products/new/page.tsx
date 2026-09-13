import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared/page-header';
import { requirePermission } from '@/server/tenant';
import { categoryOptions, supplierOptions } from '@/server/services/products';

import { ProductForm } from '../product-form';

export const metadata: Metadata = { title: 'Add product' };

export default async function NewProductPage() {
  const context = await requirePermission('products.create');

  const [categories, suppliers] = await Promise.all([
    categoryOptions(context.organization.id),
    supplierOptions(context.organization.id),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Add product or service"
        description="Set it up once and it is ready to drop onto a quotation, invoice or purchase order."
      />
      <ProductForm
        categories={categories}
        suppliers={suppliers.map((supplier) => ({
          id: supplier.id,
          name: supplier.companyName ?? supplier.name,
        }))}
        currency={context.organization.currency}
      />
    </div>
  );
}
