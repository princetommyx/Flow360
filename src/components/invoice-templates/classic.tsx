import { LogoMark } from '@/components/brand/logo';
import { brand } from '@/lib/config/brand';
import { formatDate } from '@/lib/date';

import {
  Note,
  Paper,
  amountIn,
  badgeStyle,
  notesOf,
  quantityOf,
  rateOf,
  totalRows,
  type InvoiceTemplateProps,
} from './parts';

/**
 * Classic — ruled sections, a status pill, a plain totals block.
 *
 * The design Adwuma360 printed before there was a choice, kept as the default
 * so nobody's invoices changed the day the others arrived.
 */
export function ClassicInvoice({ doc }: InvoiceTemplateProps) {
  const money = amountIn(doc);
  const notes = notesOf(doc);

  return (
    <Paper className="p-10 text-[#1a1c23] print:p-0">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-[#e6e7eb] pb-7">
        <div>
          <div className="flex items-center gap-2.5">
            <LogoMark size={34} />
            <span className="text-lg font-semibold tracking-[-0.02em]">{doc.seller.name}</span>
          </div>
          <address className="mt-3 not-italic text-[12px] leading-relaxed text-[#5a5f6d]">
            {doc.seller.companyName ? (
              <div className="font-medium text-[#1a1c23]">{doc.seller.companyName}</div>
            ) : null}
            {doc.seller.addressLines.map((line) => (
              <div key={line}>{line}</div>
            ))}
            {doc.seller.taxId ? <div>Tax ID: {doc.seller.taxId}</div> : null}
            {doc.seller.email ? <div>{doc.seller.email}</div> : null}
            {doc.seller.phone ? <div>{doc.seller.phone}</div> : null}
          </address>
        </div>

        <div className="text-right">
          <h1 className="text-2xl font-semibold uppercase tracking-[0.08em]">Invoice</h1>
          <p className="mt-1 font-mono text-[15px] font-medium">{doc.number}</p>
          <span
            className="mt-3 inline-block rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
            style={badgeStyle(doc.status)}
          >
            {doc.statusLabel}
          </span>
        </div>
      </header>

      <section className="grid gap-8 border-b border-[#e6e7eb] py-7 sm:grid-cols-2">
        <div>
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#8b909c]">
            Billed to
          </p>
          <p className="mt-2 text-[14px] font-semibold">
            {doc.buyer.companyName ?? doc.buyer.name}
          </p>
          <address className="mt-1 not-italic text-[12px] leading-relaxed text-[#5a5f6d]">
            {doc.buyer.companyName ? <div>{doc.buyer.name}</div> : null}
            {doc.buyer.addressLines.map((line) => (
              <div key={line}>{line}</div>
            ))}
            {doc.buyer.taxId ? <div>Tax ID: {doc.buyer.taxId}</div> : null}
            {doc.buyer.email ? <div>{doc.buyer.email}</div> : null}
          </address>
        </div>

        <dl className="space-y-2 text-[12.5px] sm:text-right">
          <Meta label="Invoice date" value={formatDate(doc.issueDate)} />
          <Meta label="Due date" value={formatDate(doc.dueDate)} />
          {doc.reference ? <Meta label="Your reference" value={doc.reference} /> : null}
          <Meta label="Amount due" value={money(doc.balanceDue)} emphasis />
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
          {doc.lines.map((line) => (
            <tr key={line.id} className="border-b border-[#f0f1f4] align-top break-inside-avoid">
              <td className="py-3 pr-4">
                <div className="font-medium">{line.name}</div>
                {line.description ? (
                  <div className="mt-0.5 text-[11.5px] text-[#5a5f6d]">{line.description}</div>
                ) : null}
              </td>
              <td className="py-3 text-right tabular-nums">{quantityOf(line)}</td>
              <td className="py-3 text-right tabular-nums">{money(line.unitPrice)}</td>
              <td className="py-3 text-right tabular-nums text-[#5a5f6d]">
                {rateOf(line.discountRate)}
              </td>
              <td className="py-3 text-right tabular-nums text-[#5a5f6d]">
                {rateOf(line.taxRate)}
              </td>
              <td className="py-3 text-right font-medium tabular-nums">
                {money(line.lineTotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="flex justify-end pt-5">
        <dl className="w-full max-w-[17rem] space-y-2 text-[12.5px]">
          {totalRows(doc).map((row) => {
            const value = `${row.negative ? '− ' : ''}${money(row.value)}`;

            if (row.kind === 'line') {
              return (
                <div key={row.label} className="flex items-baseline justify-between">
                  <dt className="text-[#5a5f6d]">{row.label}</dt>
                  <dd className="tabular-nums">{value}</dd>
                </div>
              );
            }

            return (
              <div
                key={row.label}
                className={
                  row.kind === 'total'
                    ? 'flex items-baseline justify-between border-t border-[#1a1c23] pt-2.5'
                    : 'flex items-baseline justify-between border-t border-[#e6e7eb] pt-2.5'
                }
              >
                <dt className="font-semibold">{row.label}</dt>
                <dd
                  className={
                    row.kind === 'total'
                      ? 'text-[16px] font-semibold tabular-nums'
                      : 'text-[15px] font-semibold tabular-nums'
                  }
                >
                  {value}
                </dd>
              </div>
            );
          })}
        </dl>
      </section>

      {notes.length > 0 ? (
        <section className="mt-9 grid gap-6 border-t border-[#e6e7eb] pt-6 sm:grid-cols-2">
          {notes.map((note) => (
            <Note
              key={note.title}
              title={note.title}
              body={note.body}
              labelClassName="text-[#8b909c]"
              bodyClassName="text-[#5a5f6d]"
            />
          ))}
        </section>
      ) : null}

      <footer className="mt-10 border-t border-[#e6e7eb] pt-5 text-center text-[11px] text-[#8b909c]">
        {doc.footer ? <p>{doc.footer}</p> : null}
        <p className="mt-1">
          {doc.seller.name}
          {doc.seller.website ? ` · ${doc.seller.website}` : ''} · Generated with {brand.name}
        </p>
      </footer>
    </Paper>
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
