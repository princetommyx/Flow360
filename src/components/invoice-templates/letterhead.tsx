import { formatDate } from '@/lib/date';

import {
  Note,
  Paper,
  amountIn,
  notesOf,
  quantityOf,
  rateOf,
  totalRows,
  type InvoiceTemplateProps,
} from './parts';

/**
 * Letterhead — for printing onto paper that already has your name on it.
 *
 * The top 45mm are left clear for whatever is pre-printed there, and the
 * business's own address is not repeated: it is on the sheet. What stays is
 * everything a letterhead cannot carry, because it changes per invoice — the
 * number, the dates, the customer, the lines and the total. The tax ID stays
 * too; leaving it off a tax invoice is not a design choice.
 *
 * On screen the reserved band is outlined so it reads as deliberate rather
 * than as a layout that has gone wrong. The outline is screen-only; the space
 * it marks is not.
 */
export function LetterheadInvoice({ doc }: InvoiceTemplateProps) {
  const money = amountIn(doc);
  const notes = notesOf(doc);

  return (
    <Paper className="px-12 pb-12 pt-0 text-[#1f2128] print:px-10 print:pb-8">
      <div className="h-[45mm] print:h-[45mm]">
        <div className="m-2 flex h-[calc(45mm-1rem)] items-center justify-center rounded border border-dashed border-[#d5d7dd] text-[10px] uppercase tracking-[0.16em] text-[#b0b3bb] print:hidden">
          Reserved for your letterhead
        </div>
      </div>

      <header className="flex flex-wrap items-end justify-between gap-6 border-b border-[#1f2128] pb-3">
        <h1 className="text-[20px] font-semibold uppercase tracking-[0.1em]">Invoice</h1>
        <p className="font-mono text-[14px] font-medium">{doc.number}</p>
      </header>

      <section className="grid gap-8 py-6 sm:grid-cols-2">
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
          <Row label="Invoice date" value={formatDate(doc.issueDate)} />
          <Row label="Due date" value={formatDate(doc.dueDate)} />
          {doc.reference ? <Row label="Your reference" value={doc.reference} /> : null}
          <Row label="Status" value={doc.statusLabel} />
          {doc.seller.taxId ? <Row label="Our tax ID" value={doc.seller.taxId} /> : null}
        </dl>
      </section>

      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="border-y border-[#c9ccd3] text-left text-[10.5px] uppercase tracking-[0.08em] text-[#5a5f6d]">
            <th className="py-2.5 font-semibold">Description</th>
            <th className="py-2.5 text-right font-semibold">Qty</th>
            <th className="py-2.5 text-right font-semibold">Unit price</th>
            <th className="py-2.5 text-right font-semibold">Tax</th>
            <th className="py-2.5 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {doc.lines.map((line) => (
            <tr key={line.id} className="border-b border-[#eceef1] align-top break-inside-avoid">
              <td className="py-3 pr-4">
                <div className="font-medium">{line.name}</div>
                {line.description ? (
                  <div className="mt-0.5 text-[11.5px] text-[#5a5f6d]">{line.description}</div>
                ) : null}
                {line.discountRate > 0 ? (
                  <div className="mt-0.5 text-[11px] text-[#8b909c]">
                    Less {line.discountRate}% discount
                  </div>
                ) : null}
              </td>
              <td className="py-3 text-right tabular-nums">{quantityOf(line)}</td>
              <td className="py-3 text-right tabular-nums">{money(line.unitPrice)}</td>
              <td className="py-3 text-right tabular-nums text-[#5a5f6d]">
                {rateOf(line.taxRate)}
              </td>
              <td className="py-3 text-right font-medium tabular-nums">{money(line.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="flex justify-end pt-5">
        <dl className="w-full max-w-[17rem] space-y-2 text-[12.5px]">
          {totalRows(doc).map((row) => (
            <div
              key={row.label}
              className={
                row.kind === 'line'
                  ? 'flex items-baseline justify-between'
                  : 'flex items-baseline justify-between border-t border-[#1f2128] pt-2.5'
              }
            >
              <dt className={row.kind === 'line' ? 'text-[#5a5f6d]' : 'font-semibold'}>
                {row.label}
              </dt>
              <dd
                className={
                  row.kind === 'line' ? 'tabular-nums' : 'text-[16px] font-semibold tabular-nums'
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
        <section className="mt-8 grid gap-6 border-t border-[#eceef1] pt-6 sm:grid-cols-2">
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

      {doc.footer ? (
        <footer className="mt-8 text-center text-[11px] text-[#8b909c]">{doc.footer}</footer>
      ) : null}
    </Paper>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 sm:justify-end">
      <dt className="text-[#8b909c]">{label}</dt>
      <dd className="tabular-nums sm:min-w-[8rem] sm:text-right">{value}</dd>
    </div>
  );
}
