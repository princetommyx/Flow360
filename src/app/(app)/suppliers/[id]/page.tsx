import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DetailList } from '@/components/shared/detail-list';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatCurrency } from '@/lib/money';
import { formatDate } from '@/lib/date';
import { hasPermission } from '@/lib/permissions';
import { requirePermission } from '@/server/tenant';
import { getSupplier, getSupplierSummary } from '@/server/services/suppliers';

export const metadata: Metadata = { title: 'Supplier' };

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requirePermission('suppliers.view');
  const currency = context.organization.currency;

  const supplier = await getSupplier(context.organization.id, id);
  if (!supplier) notFound();

  const summary = await getSupplierSummary(context.organization.id, supplier.id);
  const canEdit = hasPermission(context.permissions, 'suppliers.edit');

  const address = [
    supplier.addressLine1,
    supplier.city,
    [supplier.state, supplier.postalCode].filter(Boolean).join(' '),
    supplier.country,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="space-y-6">
      <PageHeader
        title={supplier.companyName ?? supplier.name}
        description={
          supplier.companyName ? `Contact: ${supplier.name}` : 'Supplier record'
        }
        meta={
          supplier.status !== 'ACTIVE' ? (
            <StatusBadge status={supplier.status} />
          ) : null
        }
        actions={
          canEdit ? (
            <Button variant="secondary" size="sm" asChild>
              <Link href={`/suppliers/${supplier.id}/edit`}>
                <Pencil /> Edit
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Billed" value={formatCurrency(summary.totalBilled, { currency })} />
        <Stat label="Paid" value={formatCurrency(summary.totalPaid, { currency })} />
        <Stat
          label="You owe"
          value={formatCurrency(summary.owed, { currency })}
          emphasis={summary.owed > 0}
        />
        <Stat label="Open orders" value={String(summary.openPurchaseOrders)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent>
            <DetailList
              items={[
                { label: 'Contact', value: supplier.name },
                {
                  label: 'Email',
                  value: supplier.email ? (
                    <a href={`mailto:${supplier.email}`} className="text-primary hover:underline">
                      {supplier.email}
                    </a>
                  ) : (
                    '—'
                  ),
                },
                {
                  label: 'Phone',
                  value: supplier.phone ? (
                    <a href={`tel:${supplier.phone}`} className="text-primary hover:underline">
                      {supplier.phone}
                    </a>
                  ) : (
                    '—'
                  ),
                },
                {
                  label: 'Website',
                  value: supplier.website ? (
                    <a
                      href={supplier.website}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-primary hover:underline"
                    >
                      {supplier.website}
                    </a>
                  ) : (
                    '—'
                  ),
                },
                { label: 'Address', value: address || '—' },
                { label: 'Tax ID', value: supplier.taxId ?? '—' },
                { label: 'Payment terms', value: `${supplier.paymentTermDays} days` },
                {
                  label: 'Last bill',
                  value: summary.lastBillAt ? formatDate(summary.lastBillAt) : '—',
                },
              ]}
            />
          </CardContent>
        </Card>

        {supplier.notes ? (
          <Card>
            <CardHeader>
              <CardTitle>Internal notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-[13px] leading-relaxed text-muted-foreground">
                {supplier.notes}
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <Card className="hover-lift p-5">
      <p className="text-[12.5px] font-medium text-muted-foreground">{label}</p>
      <p
        className={`mt-2 text-xl font-semibold tracking-[-0.02em] tabular ${
          emphasis ? 'text-foreground' : ''
        }`}
      >
        {value}
      </p>
    </Card>
  );
}
