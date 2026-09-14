import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared/page-header';
import { requirePermission } from '@/server/tenant';

import { SupplierForm } from '../supplier-form';

export const metadata: Metadata = { title: 'New supplier' };

export default async function NewSupplierPage() {
  await requirePermission('suppliers.create');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Add supplier"
        description="Only a contact name is required — everything else can be filled in later."
      />
      <SupplierForm />
    </div>
  );
}
