import { brand } from '@/lib/config/brand';
import { formatDate } from '@/lib/date';

import {
  Note,
  Paper,
  amountIn,
  notesOf,
  quantityOf,
  totalRows,
  type InvoiceTemplateProps,
} from './parts';

/**
 * Elegant — serif headings, hairline rules, a great deal of white.
 *
 * Built for the businesses whose invoice is part of how they present
 * themselves: a studio, a consultancy, a caterer. It gives up the tax and
 * discount columns to keep the page quiet, and states the rate in the line
 * instead where there is one.
 */
export function ElegantInvoice({ doc }: InvoiceTemplateProps) {
  const money = amountIn(doc);
  const notes = notesOf(doc);

  return (
    <Paper className="px-14 py-12 text-[#26262b] print:px-10 print:py-8">
      <header className="text-center">
        <h1 className="font-serif text-[30px] font-normal leading-tight tracking-[-0.01em]">
          {doc.seller.companyName ?? doc.seller.name}
        </h1>
        <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-[#8a8a92]">Invoice</p>
        <p className="mt-4 text-[11.5px] leading-relaxed text-[#6d6d75]">
          {[...doc.seller.addressLines, doc.seller.phone, doc.seller.email, doc.seller.website]
            .filter(Boolean)
            .join('  ·  ')}
        </p>
      </header>

      <div className="mx-auto my-9 h-px w-16 bg-[#c9c9d0]" />

      <section className="flex flex-wrap justify-between gap-8 text-[12px]">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-[#8a8a92]">Invoiced to</p>
          <p className="mt-2 font-serif text-[16px]">
            {doc.buyer.companyName ?? doc.buyer.name}
          </p>
          <address className="mt-1 not-italic leading-relaxed text-[#6d6d75]">
            {doc.buyer.companyName ? <div>{doc.buyer.name}</div> : null}
            {doc.buyer.addressLines.map((line) => (
              <div key={line}>{line}</div>
            ))}
            {doc.buyer.taxId ? <div>Tax ID: {doc.buyer.taxId}</div> : null}
            {doc.buyer.email ? <div>{doc.buyer.email}</div> : null}
          </address>
        </div>

        <dl className="space-y-2 text-right">
          <Line label="Invoice no." value={doc.number} />
          <Line label="Date" value={formatDate(doc.issueDate)} />
          <Line label="Due" value={formatDate(doc.dueDate)} />
          {doc.reference ? <Line label="Reference" value={doc.reference} /> : null}
          <Line label="Status" value={doc.statusLabel} />
        </dl>
      </section>

      <table className="mt-10 w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="border-b border-[#c9c9d0] text-left text-[10px] uppercase tracking-[0.18em] text-[#8a8a92]">
            <th className="pb-3 font-normal">Item</th>
            <th className="pb-3 text-right font-normal">Qty</th>
            <th className="pb-3 text-right font-normal">Rate</th>
            <th className="pb-3 text-right font-normal">Amount</th>
          </tr>
        </thead>
        <tbody>
          {doc.lines.map((line) => (
            <tr key={line.id} className="border-b border-[#eaeaee] align-top break-inside-avoid">
              <td className="py-4 pr-6">
                <div className="font-serif text-[14px]">{line.name}</div>
                {line.description ? (
                  <div className="mt-1 text-[11.5px] leading-relaxed text-[#6d6d75]">
                    {line.description}
                  </div>
                ) : null}
                {line.discountRate > 0 || line.taxRate > 0 ? (
                  <div className="mt-1 text-[11px] text-[#8a8a92]">
                    {[
                      line.discountRate > 0 ? `${line.discountRate}% discount` : null,
                      line.taxRate > 0 ? `${doc.taxLabel} at ${line.taxRate}%` : null,
                    ]
                      .filter(Boolean)
                      .join('  ·  ')}
                  </div>
                ) : null}
              </td>
              <td className="py-4 text-right tabular-nums">{quantityOf(line)}</td>
              <td className="py-4 text-right tabular-nums">{money(line.unitPrice)}</td>
              <td className="py-4 text-right tabular-nums">{money(line.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="flex justify-end pt-6">
        <dl className="w-full max-w-[16rem] space-y-2.5 text-[12.5px]">
          {totalRows(doc).map((row) => (
            <div
              key={row.label}
              className={
                row.kind === 'line'
                  ? 'flex items-baseline justify-between'
                  : 'flex items-baseline justify-between border-t border-[#c9c9d0] pt-3'
              }
            >
              <dt className={row.kind === 'line' ? 'text-[#6d6d75]' : 'uppercase tracking-[0.14em] text-[10px] text-[#8a8a92]'}>
                {row.label}
              </dt>
              <dd
                className={
                  row.kind === 'line'
                    ? 'tabular-nums'
                    : 'font-serif text-[18px] tabular-nums'
                }
              >
                {row.negative ? '− ' : ''}
                {money(row.value)}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {notes.length > 0 ? (
        <section className="mt-10 space-y-5 border-t border-[#eaeaee] pt-7">
          {notes.map((note) => (
            <Note
              key={note.title}
              title={note.title}
              body={note.body}
              labelClassName="tracking-[0.18em] text-[10px] font-normal text-[#8a8a92]"
              bodyClassName="text-[#6d6d75]"
            />
          ))}
        </section>
      ) : null}

      <footer className="mt-12 text-center text-[10.5px] text-[#8a8a92]">
        {doc.footer ? <p className="font-serif text-[12px] text-[#6d6d75]">{doc.footer}</p> : null}
        <p className="mt-2">
          {doc.seller.taxId ? `Tax ID ${doc.seller.taxId} · ` : ''}Generated with {brand.name}
        </p>
      </footer>
    </Paper>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-end gap-6">
      <dt className="text-[#8a8a92]">{label}</dt>
      <dd className="min-w-[7.5rem] text-right tabular-nums">{value}</dd>
    </div>
  );
}
