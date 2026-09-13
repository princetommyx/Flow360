import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/shared/page-header';
import { requirePermission } from '@/server/tenant';
import { getCustomer } from '@/server/services/customers';
import { toNumber } from '@/lib/money';

import { CustomerForm } from '../../customer-form';

export const metadata: Metadata = { title: 'Edit customer' };

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requirePermission('customers.edit');

  const customer = await getCustomer(context.organization.id, id);
  if (!customer) notFound();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={`Edit ${customer.companyName ?? customer.name}`}
        description="Changes apply to new documents; existing invoices keep the details they were issued with."
      />
      <CustomerForm
        customerId={customer.id}
        defaultValues={{
          name: customer.name,
          companyName: customer.companyName ?? '',
          email: customer.email ?? '',
          phone: customer.phone ?? '',
          website: customer.website ?? '',
          taxId: customer.taxId ?? '',
          addressLine1: customer.addressLine1 ?? '',
          addressLine2: customer.addressLine2 ?? '',
          city: customer.city ?? '',
          state: customer.state ?? '',
          postalCode: customer.postalCode ?? '',
          country: customer.country ?? '',
          creditLimit: customer.creditLimit ? toNumber(customer.creditLimit) : null,
          paymentTermDays: customer.paymentTermDays,
          notes: customer.notes ?? '',
          tags: customer.tags,
          status: customer.status,
        }}
      />
    </div>
  );
}
