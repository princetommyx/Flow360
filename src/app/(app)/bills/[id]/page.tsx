import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DetailList } from '@/components/shared/detail-list';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { db } from '@/lib/db';
import { formatCurrency, formatNumber, round, toNumber } from '@/lib/money';
import { formatDate } from '@/lib/date';
import { hasPermission } from '@/lib/permissions';
import { requirePermission } from '@/server/tenant';
import { EDITABLE_STATUSES, getBill } from '@/server/services/bills';

import { ApproveButton } from './approve-button';
import { PayPanel } from './pay-panel';

export const metadata: Metadata = { title: 'Bill' };

export default async function BillDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requirePermission('bills.view');

  const bill = await getBill(context.organization.id, id);
  if (!bill) notFound();

  const accounts = await db.account.findMany({
    where: { organizationId: context.organization.id, deletedAt: null, isActive: true },
    orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
    select: { id: true, name: true },
  });

  const currency = bill.currency;
  const can = {
    edit: hasPermission(context.permissions, 'bills.edit'),
    pay: hasPermission(context.permissions, 'payments.create'),
  };

  const supplierName = bill.supplier.companyName ?? bill.supplier.name;
  const outstanding = round(toNumber(bill.total) - toNumber(bill.amountPaid));
  const payable =
    can.pay &&
    outstanding > 0 &&
    ['AWAITING_PAYMENT', 'PARTIALLY_PAID', 'OVERDUE'].includes(bill.status);

  return (
    <div className="space-y-6">
      <PageHeader
        title={bill.number}
        description={`Billed by ${supplierName} on ${formatDate(bill.issueDate)}.`}
        meta={<StatusBadge status={bill.status} />}
        actions={
          <>
            {can.edit && EDITABLE_STATUSES.includes(bill.status) ? (
              <>
                <Button variant="secondary" size="sm" asChild>
                  <Link href={`/bills/${bill.id}/edit`}>
                    <Pencil /> Edit
                  </Link>
                </Button>
                <ApproveButton billId={bill.id} />
              </>
            ) : null}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-[14px]">Lines</CardTitle>
              <CardDescription>What the supplier charged you for.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bill.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="text-[13.5px] font-medium">{item.name}</p>
                          {item.description ? (
                            <p className="mt-0.5 text-[12px] text-muted-foreground">
                              {item.description}
                            </p>
                          ) : null}
                          {item.product ? (
                            <p className="mt-0.5 font-mono text-[11.5px] text-muted-foreground">
                              {item.product.sku}
                            </p>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right text-[13px] tabular">
                          {formatNumber(toNumber(item.quantity), 0)} {item.unit}
                        </TableCell>
                        <TableCell className="text-right text-[13px] tabular">
                          {formatCurrency(toNumber(item.unitPrice), { currency })}
                        </TableCell>
                        <TableCell className="text-right text-[13px] font-medium tabular">
                          {formatCurrency(toNumber(item.lineTotal), { currency })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Separator className="my-4" />

              <dl className="ml-auto max-w-xs space-y-2 text-[13.5px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="tabular">
                    {formatCurrency(toNumber(bill.subtotal), { currency })}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Tax</dt>
                  <dd className="tabular">
                    {formatCurrency(toNumber(bill.taxAmount), { currency })}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Total</dt>
                  <dd className="tabular">
                    {formatCurrency(toNumber(bill.total), { currency })}
                  </dd>
                </div>
                {toNumber(bill.amountPaid) > 0 ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Paid</dt>
                    <dd className="tabular text-success">
                      − {formatCurrency(toNumber(bill.amountPaid), { currency })}
                    </dd>
                  </div>
                ) : null}
                <Separator />
                <div className="flex justify-between gap-4">
                  <dt className="font-medium">Outstanding</dt>
                  <dd className="text-[15px] font-semibold tabular">
                    {formatCurrency(outstanding, { currency })}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {bill.payments.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-[14px]">Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {bill.payments.map((payment) => (
                    <li
                      key={payment.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-[12.5px] font-medium">
                          {payment.number}
                        </p>
                        <p className="mt-0.5 text-[12px] text-muted-foreground">
                          {formatDate(payment.paidAt)} · {payment.account?.name ?? '—'}
                          {payment.reference ? ` · ${payment.reference}` : ''}
                        </p>
                      </div>
                      <span className="text-[13px] font-semibold tabular">
                        {formatCurrency(toNumber(payment.amount), { currency })}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : null}

          {payable ? (
            <PayPanel
              billId={bill.id}
              outstanding={outstanding}
              currency={currency}
              accounts={accounts}
            />
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-[14px]">Supplier</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  { label: 'Name', value: supplierName },
                  { label: 'Email', value: bill.supplier.email ?? '—' },
                  { label: 'Phone', value: bill.supplier.phone ?? '—' },
                ]}
              />
              <Button variant="secondary" size="sm" className="mt-4 w-full" asChild>
                <Link href={`/suppliers/${bill.supplier.id}`}>View supplier</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[14px]">Bill</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  { label: 'Their reference', value: bill.supplierRef ?? '—' },
                  { label: 'Issued', value: formatDate(bill.issueDate) },
                  { label: 'Due', value: formatDate(bill.dueDate) },
                  { label: 'Currency', value: bill.currency },
                ]}
              />
              {bill.purchaseOrder ? (
                <Button variant="secondary" size="sm" className="mt-4 w-full" asChild>
                  <Link href={`/purchase-orders/${bill.purchaseOrder.id}`}>
                    Order {bill.purchaseOrder.number}
                  </Link>
                </Button>
              ) : null}
            </CardContent>
          </Card>

          {bill.notes ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-[14px]">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-muted-foreground">
                  {bill.notes}
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
