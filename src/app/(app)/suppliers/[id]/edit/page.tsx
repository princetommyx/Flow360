import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PageHeader } from '@/components/shared/page-header';
import { requirePermission } from '@/server/tenant';
import { getSupplier } from '@/server/services/suppliers';

import { SupplierForm } from '../../supplier-form';

export const metadata: Metadata = { title: 'Edit supplier' };

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requirePermission('suppliers.edit');

  const supplier = await getSupplier(context.organization.id, id);
  if (!supplier) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={`Edit ${supplier.companyName ?? supplier.name}`} />
      <SupplierForm
        supplierId={supplier.id}
        defaultValues={{
          name: supplier.name,
          companyName: supplier.companyName ?? '',
          email: supplier.email ?? '',
          phone: supplier.phone ?? '',
          website: supplier.website ?? '',
          taxId: supplier.taxId ?? '',
          addressLine1: supplier.addressLine1 ?? '',
          city: supplier.city ?? '',
          state: supplier.state ?? '',
          postalCode: supplier.postalCode ?? '',
          country: supplier.country ?? '',
          paymentTermDays: supplier.paymentTermDays,
          notes: supplier.notes ?? '',
          status: supplier.status,
        }}
      />
    </div>
  );
}
