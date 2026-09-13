import type { Metadata } from 'next';

import { PageHeader } from '@/components/shared/page-header';
import { requirePermission } from '@/server/tenant';

import { CustomerForm } from '../customer-form';

export const metadata: Metadata = { title: 'Add customer' };

export default async function NewCustomerPage() {
  await requirePermission('customers.create');

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Add customer"
        description="Only a contact name is required — everything else can be filled in later."
      />
      <CustomerForm />
    </div>
  );
}
