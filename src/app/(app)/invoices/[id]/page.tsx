import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { HandCoins, Pencil, ReceiptText } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { db } from '@/lib/db';
import { formatCurrency, formatNumber, toNumber } from '@/lib/money';
import { daysOverdue, formatDate } from '@/lib/date';
import { hasPermission } from '@/lib/permissions';
import { humanizeEnum } from '@/lib/utils';
import { requirePermission } from '@/server/tenant';
import { getInvoice } from '@/server/services/invoices';

import { InvoiceActions } from './invoice-actions';
import { RecordPaymentDialog } from './record-payment-dialog';

export const metadata: Metadata = { title: 'Invoice' };

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requirePermission('invoices.view');
  const currency = context.organization.currency;

  const invoice = await getInvoice(context.organization.id, id);
  if (!invoice) notFound();

  const accounts = await db.account.findMany({
    where: { organizationId: context.organization.id, deletedAt: null, isActive: true },
    orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
    select: { id: true, name: true },
  });

  const can = {
    edit: hasPermission(context.permissions, 'invoices.edit'),
    create: hasPermission(context.permissions, 'invoices.create'),
    pay: hasPermission(context.permissions, 'payments.create'),
  };

  const outstanding = toNumber(invoice.balanceDue);
  const isOpen = !['DRAFT', 'CANCELLED', 'PAID'].includes(invoice.status);
  const overdueDays =
    isOpen && invoice.dueDate < new Date() ? daysOverdue(invoice.dueDate) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={invoice.number}
        description={`Issued to ${invoice.customer.companyName ?? invoice.customer.name} on ${formatDate(invoice.issueDate)}.`}
        meta={<StatusBadge status={invoice.status} />}
        actions={
          <>
            {can.edit && invoice.status === 'DRAFT' ? (
              <Button variant="secondary" size="sm" asChild>
                <Link href={`/invoices/${invoice.id}/edit`}>
                  <Pencil /> Edit
                </Link>
              </Button>
            ) : null}
            <InvoiceActions
              invoiceId={invoice.id}
              invoiceNumber={invoice.number}
              status={invoice.status}
              can={can}
            />
            {can.pay && outstanding > 0 && isOpen ? (
              <RecordPaymentDialog
                invoiceId={invoice.id}
                invoiceNumber={invoice.number}
                outstanding={outstanding}
                currency={currency}
                accounts={accounts}
              />
            ) : null}
          </>
        }
      />

      {overdueDays > 0 ? (
        <Alert variant="destructive">
          <AlertDescription className="text-foreground">
            This invoice is <strong>{overdueDays} days past due</strong> with{' '}
            <strong>{formatCurrency(outstanding, { currency })}</strong> outstanding.
          </AlertDescription>
        </Alert>
      ) : null}

      {invoice.status === 'DRAFT' ? (
        <Alert variant="info">
          <AlertDescription className="text-foreground">
            This is still a draft. Sending it commits the stock on its lines and starts
            the payment clock.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Items</CardTitle>
              <CardDescription>
                {invoice.items.length} line{invoice.items.length === 1 ? '' : 's'} on this
                invoice.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Description</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">
                    Unit price
                  </TableHead>
                  <TableHead className="hidden text-right md:table-cell">Disc</TableHead>
                  <TableHead className="hidden text-right md:table-cell">Tax</TableHead>
                  <TableHead className="pr-5 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item) => (
                  <TableRow key={item.id} className="hover:bg-transparent">
                    <TableCell className="pl-5">
                      <p className="text-[13.5px] font-medium">{item.name}</p>
                      {item.description ? (
                        <p className="mt-0.5 text-[12px] text-muted-foreground">
                          {item.description}
                        </p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right tabular">
                      {formatNumber(item.quantity, 0)} {item.unit}
                    </TableCell>
                    <TableCell className="hidden text-right tabular sm:table-cell">
                      {formatCurrency(item.unitPrice, { currency })}
                    </TableCell>
                    <TableCell className="hidden text-right tabular text-muted-foreground md:table-cell">
                      {toNumber(item.discountRate) > 0
                        ? `${toNumber(item.discountRate)}%`
                        : '—'}
                    </TableCell>
                    <TableCell className="hidden text-right tabular text-muted-foreground md:table-cell">
                      {toNumber(item.taxRate) > 0 ? `${toNumber(item.taxRate)}%` : '—'}
                    </TableCell>
                    <TableCell className="pr-5 text-right font-medium tabular">
                      {formatCurrency(item.lineTotal, { currency })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end border-t border-border bg-surface-subtle px-5 py-4">
              <dl className="w-full max-w-xs space-y-2 text-[13.5px]">
                <SummaryRow
                  label="Subtotal"
                  value={formatCurrency(invoice.subtotal, { currency })}
                />
                {toNumber(invoice.discountAmount) > 0 ? (
                  <SummaryRow
                    label="Discount"
                    value={`− ${formatCurrency(invoice.discountAmount, { currency })}`}
                    muted
                  />
                ) : null}
                <SummaryRow
                  label="Tax"
                  value={formatCurrency(invoice.taxAmount, { currency })}
                />
                {toNumber(invoice.shippingAmount) > 0 ? (
                  <SummaryRow
                    label="Shipping"
                    value={formatCurrency(invoice.shippingAmount, { currency })}
                  />
                ) : null}
                <Separator className="my-2" />
                <div className="flex items-baseline justify-between">
                  <dt className="font-medium">Total</dt>
                  <dd className="text-lg font-semibold tracking-[-0.02em] tabular">
                    {formatCurrency(invoice.total, { currency })}
                  </dd>
                </div>
                {toNumber(invoice.amountPaid) > 0 ? (
                  <>
                    <SummaryRow
                      label="Paid"
                      value={`− ${formatCurrency(invoice.amountPaid, { currency })}`}
                      muted
                    />
                    <div className="flex items-baseline justify-between">
                      <dt className="font-medium">Outstanding</dt>
                      <dd className="font-semibold tabular">
                        {formatCurrency(outstanding, { currency })}
                      </dd>
                    </div>
                  </>
                ) : null}
              </dl>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <DetailList
                columns={1}
                items={[
                  {
                    label: 'Customer',
                    value: (
                      <Link
                        href={`/customers/${invoice.customer.id}`}
                        className="text-primary hover:underline"
                      >
                        {invoice.customer.companyName ?? invoice.customer.name}
                      </Link>
                    ),
                  },
                  { label: 'Issue date', value: formatDate(invoice.issueDate) },
                  { label: 'Due date', value: formatDate(invoice.dueDate) },
                  { label: 'Reference', value: invoice.reference },
                  {
                    label: 'Converted from',
                    value: invoice.quotation ? (
                      <Link
                        href={`/quotations/${invoice.quotation.id}`}
                        className="font-mono text-primary hover:underline"
                      >
                        {invoice.quotation.number}
                      </Link>
                    ) : null,
                    hideWhenEmpty: true,
                  },
                  { label: 'Sent', value: invoice.sentAt ? formatDate(invoice.sentAt) : null },
                  { label: 'Paid', value: invoice.paidAt ? formatDate(invoice.paidAt) : null },
                ]}
              />

              {invoice.notes || invoice.terms ? (
                <>
                  <Separator className="my-4" />
                  {invoice.notes ? (
                    <div className="mb-3">
                      <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                        Notes
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed">
                        {invoice.notes}
                      </p>
                    </div>
                  ) : null}
                  {invoice.terms ? (
                    <div>
                      <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                        Terms
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed">
                        {invoice.terms}
                      </p>
                    </div>
                  ) : null}
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Payments</CardTitle>
                <CardDescription>
                  {invoice.payments.length} recorded against this invoice.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              {invoice.payments.length === 0 ? (
                <EmptyState
                  compact
                  icon={HandCoins}
                  title="Nothing received yet"
                  description={
                    invoice.status === 'DRAFT'
                      ? 'Send the invoice before recording a payment.'
                      : 'Record a payment when the money arrives.'
                  }
                />
              ) : (
                <ul className="divide-y divide-border border-t border-border">
                  {invoice.payments.map((payment) => (
                    <li key={payment.id} className="px-5 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-mono text-[12.5px] font-medium">
                            {payment.number}
                          </p>
                          <p className="mt-0.5 text-[12px] text-muted-foreground">
                            {formatDate(payment.paidAt)} ·{' '}
                            {humanizeEnum(payment.method)}
                          </p>
                          {payment.account ? (
                            <p className="text-[11.5px] text-muted-foreground">
                              into {payment.account.name}
                            </p>
                          ) : null}
                        </div>
                        <span className="shrink-0 text-[13px] font-semibold text-success tabular">
                          +{formatCurrency(payment.amount, { currency })}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {invoice.customer.email ? (
            <Card className="p-5">
              <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
                Billing contact
              </p>
              <p className="mt-2 text-[13.5px] font-medium">{invoice.customer.name}</p>
              <a
                href={`mailto:${invoice.customer.email}`}
                className="text-[13px] text-primary hover:underline"
              >
                {invoice.customer.email}
              </a>
              {invoice.customer.taxId ? (
                <Badge variant="neutral" size="sm" className="mt-3">
                  Tax ID {invoice.customer.taxId}
                </Badge>
              ) : null}
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className={muted ? 'text-muted-foreground' : ''}>{label}</dt>
      <dd className={`tabular ${muted ? 'text-muted-foreground' : ''}`}>{value}</dd>
    </div>
  );
}
