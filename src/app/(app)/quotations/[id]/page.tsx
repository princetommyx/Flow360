import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Pencil } from 'lucide-react';

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
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatCurrency, formatNumber, toNumber } from '@/lib/money';
import { formatDate } from '@/lib/date';
import { hasPermission } from '@/lib/permissions';
import { requirePermission } from '@/server/tenant';
import { getQuotation } from '@/server/services/quotations';

import { QuotationActions } from './quotation-actions';

export const metadata: Metadata = { title: 'Quotation' };

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requirePermission('quotations.view');
  const currency = context.organization.currency;

  const quotation = await getQuotation(context.organization.id, id);
  if (!quotation) notFound();

  const can = {
    edit: hasPermission(context.permissions, 'quotations.edit'),
    create: hasPermission(context.permissions, 'quotations.create'),
    invoice: hasPermission(context.permissions, 'invoices.create'),
  };

  const customerName = quotation.customer.companyName ?? quotation.customer.name;
  const lapsed =
    quotation.status === 'SENT' && quotation.expiryDate < new Date();

  return (
    <div className="space-y-6">
      <PageHeader
        title={quotation.number}
        description={`Quoted to ${customerName} on ${formatDate(quotation.issueDate)}.`}
        meta={<StatusBadge status={quotation.status} />}
        actions={
          <>
            {can.edit && quotation.status === 'DRAFT' ? (
              <Button variant="secondary" size="sm" asChild>
                <Link href={`/quotations/${quotation.id}/edit`}>
                  <Pencil /> Edit
                </Link>
              </Button>
            ) : null}
            <QuotationActions
              quotationId={quotation.id}
              quotationNumber={quotation.number}
              status={quotation.status}
              hasInvoice={Boolean(quotation.invoice)}
              can={can}
            />
          </>
        }
      />

      {quotation.invoice ? (
        <Alert variant="success">
          <AlertDescription className="text-foreground">
            This quotation became invoice{' '}
            <Link
              href={`/invoices/${quotation.invoice.id}`}
              className="font-medium text-primary hover:underline"
            >
              {quotation.invoice.number}
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : null}

      {quotation.status === 'DRAFT' ? (
        <Alert variant="info">
          <AlertDescription className="text-foreground">
            This is still a draft. Sending it starts the clock on the validity date.
          </AlertDescription>
        </Alert>
      ) : null}

      {lapsed ? (
        <Alert variant="warning">
          <AlertDescription className="text-foreground">
            This quotation was only valid until{' '}
            <strong>{formatDate(quotation.expiryDate)}</strong>. Reopen it to put the
            same price back in front of the customer, or duplicate it to requote.
          </AlertDescription>
        </Alert>
      ) : null}

      {quotation.status === 'ACCEPTED' && !quotation.invoice ? (
        <Alert variant="info">
          <AlertDescription className="text-foreground">
            Accepted and ready to bill. Converting copies these lines into a draft
            invoice. Nothing is sent and no stock moves until you send that invoice.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Items</CardTitle>
              <CardDescription>
                {quotation.items.length} line{quotation.items.length === 1 ? '' : 's'} on
                this quotation.
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
                {quotation.items.map((item) => (
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
                  value={formatCurrency(quotation.subtotal, { currency })}
                />
                {toNumber(quotation.discountAmount) > 0 ? (
                  <SummaryRow
                    label="Discount"
                    value={`− ${formatCurrency(quotation.discountAmount, { currency })}`}
                    muted
                  />
                ) : null}
                <SummaryRow
                  label="Tax"
                  value={formatCurrency(quotation.taxAmount, { currency })}
                />
                <Separator className="my-2" />
                <div className="flex items-baseline justify-between">
                  <dt className="font-medium">Total</dt>
                  <dd className="text-lg font-semibold tracking-[-0.02em] tabular">
                    {formatCurrency(quotation.total, { currency })}
                  </dd>
                </div>
              </dl>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  {
                    label: 'Customer',
                    value: (
                      <Link
                        href={`/customers/${quotation.customerId}`}
                        className="text-primary hover:underline"
                      >
                        {customerName}
                      </Link>
                    ),
                  },
                  { label: 'Issued', value: formatDate(quotation.issueDate) },
                  { label: 'Valid until', value: formatDate(quotation.expiryDate) },
                  ...(quotation.sentAt
                    ? [{ label: 'Sent', value: formatDate(quotation.sentAt) }]
                    : []),
                  ...(quotation.acceptedAt
                    ? [{ label: 'Accepted', value: formatDate(quotation.acceptedAt) }]
                    : []),
                  ...(quotation.rejectedAt
                    ? [{ label: 'Declined', value: formatDate(quotation.rejectedAt) }]
                    : []),
                  ...(quotation.convertedAt
                    ? [{ label: 'Converted', value: formatDate(quotation.convertedAt) }]
                    : []),
                ]}
              />
            </CardContent>
          </Card>

          {quotation.notes || quotation.terms ? (
            <Card>
              <CardHeader>
                <CardTitle>Notes &amp; terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-[13px] leading-relaxed text-muted-foreground">
                {quotation.notes ? <p className="whitespace-pre-line">{quotation.notes}</p> : null}
                {quotation.terms ? (
                  <p className="whitespace-pre-line border-t border-border pt-4">
                    {quotation.terms}
                  </p>
                ) : null}
              </CardContent>
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
