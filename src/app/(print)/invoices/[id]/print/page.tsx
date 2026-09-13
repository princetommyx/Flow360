import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { LogoMark } from '@/components/brand/logo';
import { db } from '@/lib/db';
import { brand } from '@/lib/config/brand';
import { formatCurrency, formatNumber, toNumber } from '@/lib/money';
import { formatDate } from '@/lib/date';
import { statusMeta } from '@/lib/status';
import { requirePermission } from '@/server/tenant';
import { getInvoice } from '@/server/services/invoices';

import { PrintToolbar } from './print-button';

export const metadata: Metadata = { title: 'Print invoice' };

export default async function InvoicePrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const context = await requirePermission('invoices.view');

  const [invoice, organization, settings] = await Promise.all([
    getInvoice(context.organization.id, id),
    db.organization.findUnique({
      where: { id: context.organization.id },
      select: {
        name: true,
        legalName: true,
        email: true,
        phone: true,
        website: true,
        taxId: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
        logoUrl: true,
      },
    }),
    db.companySettings.findUnique({
      where: { organizationId: context.organization.id },
      select: { paymentInstructions: true, invoiceFooter: true, taxLabel: true },
    }),
  ]);

  if (!invoice || !organization) notFound();

  const currency = invoice.currency;
  const status = statusMeta(invoice.status);
  const outstanding = toNumber(invoice.balanceDue);
  const paid = toNumber(invoice.amountPaid);

  const companyAddress = [
    organization.addressLine1,
    organization.addressLine2,
    [organization.city, organization.state].filter(Boolean).join(', '),
    organization.postalCode,
    organization.country,
  ].filter(Boolean);

  const customerAddress = [
    invoice.customer.addressLine1,
    invoice.customer.addressLine2,
    [invoice.customer.city, invoice.customer.state].filter(Boolean).join(', '),
    invoice.customer.postalCode,
    invoice.customer.country,
  ].filter(Boolean);

  return (
    <div className="min-h-dvh bg-muted/40 print:bg-white">
      <PrintToolbar invoiceId={invoice.id} />

      <article className="mx-auto my-6 w-full max-w-[52rem] bg-white p-10 text-[#1a1c23] shadow-lg print:my-0 print:max-w-none print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-[#e6e7eb] pb-7">
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark size={34} />
              <span className="text-lg font-semibold tracking-[-0.02em]">
                {organization.name}
              </span>
            </div>
            <address className="mt-3 not-italic text-[12px] leading-relaxed text-[#5a5f6d]">
              {organization.legalName ? (
                <div className="font-medium text-[#1a1c23]">{organization.legalName}</div>
              ) : null}
              {companyAddress.map((line) => (
                <div key={line}>{line}</div>
              ))}
              {organization.taxId ? <div>Tax ID: {organization.taxId}</div> : null}
              {organization.email ? <div>{organization.email}</div> : null}
              {organization.phone ? <div>{organization.phone}</div> : null}
            </address>
          </div>

          <div className="text-right">
            <h1 className="text-2xl font-semibold uppercase tracking-[0.08em] text-[#1a1c23]">
              Invoice
            </h1>
            <p className="mt-1 font-mono text-[15px] font-medium">{invoice.number}</p>
            <span
              className="mt-3 inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
              style={badgeStyle(invoice.status)}
            >
              {status.label}
            </span>
          </div>
        </header>

        <section className="grid gap-8 border-b border-[#e6e7eb] py-7 sm:grid-cols-2">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#8b909c]">
              Billed to
            </p>
            <p className="mt-2 text-[14px] font-semibold">
              {invoice.customer.companyName ?? invoice.customer.name}
            </p>
            <address className="mt-1 not-italic text-[12px] leading-relaxed text-[#5a5f6d]">
              {invoice.customer.companyName ? <div>{invoice.customer.name}</div> : null}
              {customerAddress.map((line) => (
                <div key={line}>{line}</div>
              ))}
              {invoice.customer.taxId ? <div>Tax ID: {invoice.customer.taxId}</div> : null}
              {invoice.customer.email ? <div>{invoice.customer.email}</div> : null}
            </address>
          </div>

          <dl className="space-y-2 text-[12.5px] sm:text-right">
            <Meta label="Invoice date" value={formatDate(invoice.issueDate)} />
            <Meta label="Due date" value={formatDate(invoice.dueDate)} />
            {invoice.reference ? (
              <Meta label="Your reference" value={invoice.reference} />
            ) : null}
            <Meta
              label="Amount due"
              value={formatCurrency(outstanding, { currency })}
              emphasis
            />
          </dl>
        </section>

        <table className="w-full border-collapse py-6 text-[12.5px]">
          <thead>
            <tr className="border-b border-[#e6e7eb] text-left text-[10.5px] uppercase tracking-[0.08em] text-[#8b909c]">
              <th className="py-3 font-semibold">Description</th>
              <th className="py-3 text-right font-semibold">Qty</th>
              <th className="py-3 text-right font-semibold">Unit price</th>
              <th className="py-3 text-right font-semibold">Disc</th>
              <th className="py-3 text-right font-semibold">Tax</th>
              <th className="py-3 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-[#f0f1f4] align-top break-inside-avoid"
              >
                <td className="py-3 pr-4">
                  <div className="font-medium">{item.name}</div>
                  {item.description ? (
                    <div className="mt-0.5 text-[11.5px] text-[#5a5f6d]">
                      {item.description}
                    </div>
                  ) : null}
                </td>
                <td className="py-3 text-right tabular-nums">
                  {formatNumber(item.quantity, 0)} {item.unit}
                </td>
                <td className="py-3 text-right tabular-nums">
                  {formatCurrency(item.unitPrice, { currency })}
                </td>
                <td className="py-3 text-right tabular-nums text-[#5a5f6d]">
                  {toNumber(item.discountRate) > 0 ? `${toNumber(item.discountRate)}%` : '—'}
                </td>
                <td className="py-3 text-right tabular-nums text-[#5a5f6d]">
                  {toNumber(item.taxRate) > 0 ? `${toNumber(item.taxRate)}%` : '—'}
                </td>
                <td className="py-3 text-right font-medium tabular-nums">
                  {formatCurrency(item.lineTotal, { currency })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="flex justify-end pt-5">
          <dl className="w-full max-w-[17rem] space-y-2 text-[12.5px]">
            <Total label="Subtotal" value={formatCurrency(invoice.subtotal, { currency })} />
            {toNumber(invoice.discountAmount) > 0 ? (
              <Total
                label="Discount"
                value={`− ${formatCurrency(invoice.discountAmount, { currency })}`}
              />
            ) : null}
            <Total
              label={settings?.taxLabel ?? 'Tax'}
              value={formatCurrency(invoice.taxAmount, { currency })}
            />
            {toNumber(invoice.shippingAmount) > 0 ? (
              <Total
                label="Shipping"
                value={formatCurrency(invoice.shippingAmount, { currency })}
              />
            ) : null}

            <div className="flex items-baseline justify-between border-t border-[#1a1c23] pt-2.5">
              <dt className="font-semibold">Total</dt>
              <dd className="text-[16px] font-semibold tabular-nums">
                {formatCurrency(invoice.total, { currency })}
              </dd>
            </div>

            {paid > 0 ? (
              <>
                <Total label="Paid to date" value={`− ${formatCurrency(paid, { currency })}`} />
                <div className="flex items-baseline justify-between border-t border-[#e6e7eb] pt-2.5">
                  <dt className="font-semibold">Amount due</dt>
                  <dd className="text-[15px] font-semibold tabular-nums">
                    {formatCurrency(outstanding, { currency })}
                  </dd>
                </div>
              </>
            ) : null}
          </dl>
        </section>

        {invoice.notes || settings?.paymentInstructions || invoice.terms ? (
          <section className="mt-9 grid gap-6 border-t border-[#e6e7eb] pt-6 sm:grid-cols-2">
            {invoice.notes ? (
              <Block title="Notes" body={invoice.notes} />
            ) : null}
            {settings?.paymentInstructions ? (
              <Block title="How to pay" body={settings.paymentInstructions} />
            ) : null}
            {invoice.terms ? <Block title="Terms" body={invoice.terms} /> : null}
          </section>
        ) : null}

        <footer className="mt-10 border-t border-[#e6e7eb] pt-5 text-center text-[11px] text-[#8b909c]">
          {settings?.invoiceFooter ? <p>{settings.invoiceFooter}</p> : null}
          <p className="mt-1">
            {organization.name}
            {organization.website ? ` · ${organization.website}` : ''} · Generated with{' '}
            {brand.name}
          </p>
        </footer>
      </article>
    </div>
  );
}

function Meta({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex justify-between gap-6 sm:justify-end">
      <dt className="text-[#8b909c]">{label}</dt>
      <dd
        className={
          emphasis
            ? 'font-semibold tabular-nums sm:min-w-[8rem] sm:text-right'
            : 'tabular-nums sm:min-w-[8rem] sm:text-right'
        }
      >
        {value}
      </dd>
    </div>
  );
}

function Total({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <dt className="text-[#5a5f6d]">{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <div className="break-inside-avoid">
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#8b909c]">
        {title}
      </p>
      <p className="mt-1.5 whitespace-pre-wrap text-[11.5px] leading-relaxed text-[#5a5f6d]">
        {body}
      </p>
    </div>
  );
}

/** Status pill colours, inlined so they survive printing without backgrounds. */
function badgeStyle(status: string): React.CSSProperties {
  const map: Record<string, { color: string; border: string }> = {
    PAID: { color: '#15803d', border: '#bbf7d0' },
    OVERDUE: { color: '#b91c1c', border: '#fecaca' },
    PARTIALLY_PAID: { color: '#b45309', border: '#fde68a' },
    CANCELLED: { color: '#6b7280', border: '#e5e7eb' },
    DRAFT: { color: '#6b7280', border: '#e5e7eb' },
  };
  const tone = map[status] ?? { color: '#1d4ed8', border: '#bfdbfe' };
  return { color: tone.color, borderColor: tone.border };
}
