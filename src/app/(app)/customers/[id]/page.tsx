import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowUpRight,
  Coins,
  FilePlus2,
  FileText,
  HandCoins,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ReceiptText,
} from 'lucide-react';

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
import { DetailList } from '@/components/shared/detail-list';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { CountUp } from '@/components/shared/count-up';
import { StatusBadge } from '@/components/shared/status-badge';
import { TabNav } from '@/components/shared/tab-nav';
import { db } from '@/lib/db';
import { formatCurrency, toNumber } from '@/lib/money';
import { formatDate } from '@/lib/date';
import { hasPermission } from '@/lib/permissions';
import { initials } from '@/lib/utils';
import { requirePermission } from '@/server/tenant';
import { getCustomer, getCustomerSummary } from '@/server/services/customers';

import { CustomerNotes } from './customer-notes';

export const metadata: Metadata = { title: 'Customer' };

const TABS = ['overview', 'invoices', 'payments', 'transactions', 'notes'] as const;
type Tab = (typeof TABS)[number];

export default async function CustomerDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ id }, { tab: tabParam }] = await Promise.all([params, searchParams]);
  const context = await requirePermission('customers.view');
  const organizationId = context.organization.id;
  const currency = context.organization.currency;

  const customer = await getCustomer(organizationId, id);
  if (!customer) notFound();

  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : 'overview';

  const [summary, counts] = await Promise.all([
    getCustomerSummary(organizationId, customer.id),
    Promise.all([
      db.invoice.count({ where: { organizationId, customerId: customer.id, deletedAt: null } }),
      db.payment.count({ where: { organizationId, customerId: customer.id, deletedAt: null } }),
      db.transaction.count({ where: { organizationId, customerId: customer.id, deletedAt: null } }),
    ]),
  ]);

  const [invoiceCount, paymentCount, transactionCount] = counts;

  const can = {
    edit: hasPermission(context.permissions, 'customers.edit'),
    invoice: hasPermission(context.permissions, 'invoices.create'),
    quote: hasPermission(context.permissions, 'quotations.create'),
  };

  const overLimit =
    customer.creditLimit !== null &&
    summary.outstanding > toNumber(customer.creditLimit);

  const address = [
    customer.addressLine1,
    customer.addressLine2,
    [customer.city, customer.state].filter(Boolean).join(', '),
    customer.postalCode,
    customer.country,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.companyName ?? customer.name}
        description={
          customer.companyName ? `Primary contact: ${customer.name}` : undefined
        }
        meta={<StatusBadge status={customer.status} />}
        actions={
          <>
            {can.quote ? (
              <Button variant="secondary" size="sm" asChild>
                <Link href={`/quotations/new?customerId=${customer.id}`}>
                  <ReceiptText /> New quote
                </Link>
              </Button>
            ) : null}
            {can.invoice ? (
              <Button size="sm" asChild>
                <Link href={`/invoices/new?customerId=${customer.id}`}>
                  <FilePlus2 /> New invoice
                </Link>
              </Button>
            ) : null}
            {can.edit ? (
              <Button variant="secondary" size="icon" asChild aria-label="Edit customer">
                <Link href={`/customers/${customer.id}/edit`}>
                  <Pencil />
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      {overLimit ? (
        <Alert variant="warning">
          <AlertDescription className="text-foreground">
            Outstanding balance of{' '}
            <strong>{formatCurrency(summary.outstanding, { currency })}</strong> exceeds
            this customer&rsquo;s credit limit of{' '}
            <strong>{formatCurrency(customer.creditLimit, { currency })}</strong>.
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total invoiced"
          value={<CountUp value={summary.totalInvoiced} kind="currency" currency={currency} decimals={2} />}
          icon={FileText}
          footer={
            <span className="text-[11.5px] text-muted-foreground">
              Across {summary.invoiceCount} invoice{summary.invoiceCount === 1 ? '' : 's'}
            </span>
          }
        />
        <StatCard
          label="Total paid"
          value={<CountUp value={summary.totalPaid} kind="currency" currency={currency} decimals={2} />}
          icon={HandCoins}
          footer={
            <span className="text-[11.5px] text-muted-foreground">
              Payments received to date
            </span>
          }
        />
        <StatCard
          label="Outstanding"
          value={<CountUp value={summary.outstanding} kind="currency" currency={currency} decimals={2} />}
          icon={Coins}
          footer={
            <span className="text-[11.5px] text-muted-foreground">
              {summary.overdue > 0
                ? `${formatCurrency(summary.overdue, { currency })} overdue`
                : 'Nothing overdue'}
            </span>
          }
        />
        <StatCard
          label="Open quotations"
          value={<CountUp value={summary.openQuotations} />}
          icon={ReceiptText}
          footer={
            <span className="text-[11.5px] text-muted-foreground">
              {summary.lastInvoiceAt
                ? `Last invoiced ${formatDate(summary.lastInvoiceAt)}`
                : 'Not yet invoiced'}
            </span>
          }
        />
      </section>

      <TabNav
        active={tab}
        tabs={[
          { value: 'overview', label: 'Overview' },
          { value: 'invoices', label: 'Invoices', count: invoiceCount },
          { value: 'payments', label: 'Payments', count: paymentCount },
          { value: 'transactions', label: 'Transactions', count: transactionCount },
          { value: 'notes', label: 'Notes' },
        ]}
      />

      {tab === 'overview' ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Customer details</CardTitle>
                <CardDescription>
                  Used on documents issued to this customer.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  {
                    label: 'Email',
                    value: customer.email ? (
                      <a
                        href={`mailto:${customer.email}`}
                        className="inline-flex items-center gap-1.5 text-primary hover:underline"
                      >
                        <Mail className="size-3.5" aria-hidden />
                        {customer.email}
                      </a>
                    ) : null,
                  },
                  {
                    label: 'Phone',
                    value: customer.phone ? (
                      <a
                        href={`tel:${customer.phone}`}
                        className="inline-flex items-center gap-1.5 text-primary hover:underline"
                      >
                        <Phone className="size-3.5" aria-hidden />
                        {customer.phone}
                      </a>
                    ) : null,
                  },
                  {
                    label: 'Website',
                    value: customer.website ? (
                      <a
                        href={customer.website}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        {customer.website}
                        <ArrowUpRight className="size-3.5" aria-hidden />
                      </a>
                    ) : null,
                  },
                  { label: 'Tax ID', value: customer.taxId },
                  {
                    label: 'Payment terms',
                    value: `${customer.paymentTermDays} days`,
                  },
                  {
                    label: 'Credit limit',
                    value:
                      customer.creditLimit !== null
                        ? formatCurrency(customer.creditLimit, { currency })
                        : null,
                  },
                  {
                    label: 'Billing address',
                    full: true,
                    value: address ? (
                      <span className="flex gap-1.5">
                        <MapPin
                          className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                        <span className="whitespace-pre-line">{address}</span>
                      </span>
                    ) : null,
                  },
                  {
                    label: 'Tags',
                    full: true,
                    value:
                      customer.tags.length > 0 ? (
                        <span className="flex flex-wrap gap-1.5">
                          {customer.tags.map((tag) => (
                            <Badge key={tag} variant="neutral" size="sm">
                              {tag}
                            </Badge>
                          ))}
                        </span>
                      ) : null,
                  },
                  {
                    label: 'Customer since',
                    value: formatDate(customer.createdAt),
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recent activity</CardTitle>
                <CardDescription>Latest documents and payments.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <RecentActivity
                organizationId={organizationId}
                customerId={customer.id}
                currency={currency}
              />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {tab === 'invoices' ? (
        <InvoicesPanel
          organizationId={organizationId}
          customerId={customer.id}
          currency={currency}
          canCreate={can.invoice}
        />
      ) : null}

      {tab === 'payments' ? (
        <PaymentsPanel
          organizationId={organizationId}
          customerId={customer.id}
          currency={currency}
        />
      ) : null}

      {tab === 'transactions' ? (
        <TransactionsPanel
          organizationId={organizationId}
          customerId={customer.id}
          currency={currency}
        />
      ) : null}

      {tab === 'notes' ? (
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Internal notes</CardTitle>
              <CardDescription>
                Visible to your team only. Never printed on documents.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <CustomerNotes
              customerId={customer.id}
              initialNotes={customer.notes ?? ''}
              canEdit={can.edit}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

async function RecentActivity({
  organizationId,
  customerId,
  currency,
}: {
  organizationId: string;
  customerId: string;
  currency: string;
}) {
  const [invoices, payments] = await Promise.all([
    db.invoice.findMany({
      where: { organizationId, customerId, deletedAt: null },
      orderBy: { issueDate: 'desc' },
      take: 4,
      select: { id: true, number: true, status: true, total: true, issueDate: true },
    }),
    db.payment.findMany({
      where: { organizationId, customerId, deletedAt: null },
      orderBy: { paidAt: 'desc' },
      take: 3,
      select: { id: true, number: true, amount: true, paidAt: true },
    }),
  ]);

  const events = [
    ...invoices.map((invoice) => ({
      id: `inv-${invoice.id}`,
      href: `/invoices/${invoice.id}`,
      title: invoice.number,
      subtitle: 'Invoice issued',
      amount: toNumber(invoice.total),
      at: invoice.issueDate,
      status: invoice.status as string | null,
    })),
    ...payments.map((payment) => ({
      id: `pay-${payment.id}`,
      href: `/payments?q=${payment.number}`,
      title: payment.number,
      subtitle: 'Payment received',
      amount: toNumber(payment.amount),
      at: payment.paidAt,
      status: null,
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 6);

  if (events.length === 0) {
    return (
      <EmptyState
        compact
        icon={FileText}
        title="Nothing yet"
        description="Documents and payments for this customer will appear here."
      />
    );
  }

  return (
    <ul className="divide-y divide-border border-t border-border">
      {events.map((event) => (
        <li key={event.id}>
          <Link
            href={event.href}
            className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-subtle"
          >
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-mono text-[12.5px] font-medium">
                {event.title}
                {event.status ? <StatusBadge status={event.status} size="sm" /> : null}
              </p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {event.subtitle} · {formatDate(event.at)}
              </p>
            </div>
            <span className="shrink-0 text-[13px] font-semibold tabular">
              {formatCurrency(event.amount, { currency })}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

async function InvoicesPanel({
  organizationId,
  customerId,
  currency,
  canCreate,
}: {
  organizationId: string;
  customerId: string;
  currency: string;
  canCreate: boolean;
}) {
  const invoices = await db.invoice.findMany({
    where: { organizationId, customerId, deletedAt: null },
    orderBy: { issueDate: 'desc' },
    take: 50,
    select: {
      id: true,
      number: true,
      status: true,
      issueDate: true,
      dueDate: true,
      total: true,
      balanceDue: true,
    },
  });

  if (invoices.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={FileText}
          title="No invoices for this customer"
          description="Raise an invoice and it will appear here with its payment status."
          action={
            canCreate ? (
              <Button size="sm" asChild>
                <Link href={`/invoices/new?customerId=${customerId}`}>New invoice</Link>
              </Button>
            ) : undefined
          }
        />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-border">
        {invoices.map((invoice) => (
          <li key={invoice.id}>
            <Link
              href={`/invoices/${invoice.id}`}
              className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface-subtle"
            >
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2">
                  <span className="font-mono text-[13px] font-medium">
                    {invoice.number}
                  </span>
                  <StatusBadge status={invoice.status} size="sm" />
                </p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  Issued {formatDate(invoice.issueDate)} · due {formatDate(invoice.dueDate)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[13.5px] font-semibold tabular">
                  {formatCurrency(invoice.total, { currency })}
                </p>
                {toNumber(invoice.balanceDue) > 0 ? (
                  <p className="text-[11.5px] text-muted-foreground tabular">
                    {formatCurrency(invoice.balanceDue, { currency })} due
                  </p>
                ) : null}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  );
}

async function PaymentsPanel({
  organizationId,
  customerId,
  currency,
}: {
  organizationId: string;
  customerId: string;
  currency: string;
}) {
  const payments = await db.payment.findMany({
    where: { organizationId, customerId, deletedAt: null },
    orderBy: { paidAt: 'desc' },
    take: 50,
    select: {
      id: true,
      number: true,
      amount: true,
      method: true,
      paidAt: true,
      reference: true,
      invoice: { select: { id: true, number: true } },
    },
  });

  if (payments.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={HandCoins}
          title="No payments recorded"
          description="Payments you record against this customer's invoices will be listed here."
        />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-border">
        {payments.map((payment) => (
          <li
            key={payment.id}
            className="flex flex-wrap items-center gap-3 px-5 py-3.5"
          >
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[13px] font-medium">{payment.number}</p>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {formatDate(payment.paidAt)} ·{' '}
                {payment.method.toLowerCase().replace(/_/g, ' ')}
                {payment.invoice ? (
                  <>
                    {' '}
                    · against{' '}
                    <Link
                      href={`/invoices/${payment.invoice.id}`}
                      className="text-primary hover:underline"
                    >
                      {payment.invoice.number}
                    </Link>
                  </>
                ) : null}
              </p>
            </div>
            <span className="text-[13.5px] font-semibold text-success tabular">
              +{formatCurrency(payment.amount, { currency })}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

async function TransactionsPanel({
  organizationId,
  customerId,
  currency,
}: {
  organizationId: string;
  customerId: string;
  currency: string;
}) {
  const transactions = await db.transaction.findMany({
    where: { organizationId, customerId, deletedAt: null },
    orderBy: { occurredAt: 'desc' },
    take: 50,
    select: {
      id: true,
      description: true,
      amount: true,
      type: true,
      occurredAt: true,
      account: { select: { name: true } },
    },
  });

  if (transactions.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Coins}
          title="No ledger entries"
          description="Money movements linked to this customer appear here once payments are recorded."
        />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <ul className="divide-y divide-border">
        {transactions.map((transaction) => {
          const amount = toNumber(transaction.amount);
          return (
            <li
              key={transaction.id}
              className="flex flex-wrap items-center gap-3 px-5 py-3.5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium">{transaction.description}</p>
                <p className="mt-0.5 text-[12px] text-muted-foreground">
                  {transaction.account.name} · {formatDate(transaction.occurredAt)}
                </p>
              </div>
              <span
                className={`text-[13.5px] font-semibold tabular ${
                  amount >= 0 ? 'text-success' : 'text-foreground'
                }`}
              >
                {amount >= 0 ? '+' : '−'}
                {formatCurrency(Math.abs(amount), { currency })}
              </span>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
