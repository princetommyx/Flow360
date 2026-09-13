import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared/page-header';
import { hasPermission } from '@/lib/permissions';
import { requirePermission } from '@/server/tenant';
import { listCategories } from '@/server/services/products';

import { CategoriesManager } from './categories-manager';

export const metadata: Metadata = { title: 'Categories' };

export default async function CategoriesPage() {
  const context = await requirePermission('products.view');
  const categories = await listCategories(context.organization.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Group your catalogue so quoting is faster and reports break down the way you think about the business."
      />

      <CategoriesManager
        categories={categories}
        can={{
          create: hasPermission(context.permissions, 'products.create'),
          edit: hasPermission(context.permissions, 'products.edit'),
          delete: hasPermission(context.permissions, 'products.delete'),
        }}
      />
    </div>
  );
}
