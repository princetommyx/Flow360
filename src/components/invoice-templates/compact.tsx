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
 * Compact — everything smaller, so long invoices stay on one sheet.
 *
 * The discount and tax columns go, folded into the description as a single
 * qualifier where a line has them, because on a thirty-line invoice they cost
 * more width than they are worth. No logo block and no footer rule: the space
 * goes to rows.
 */
export function CompactInvoice({ doc }: InvoiceTemplateProps) {
  const money = amountIn(doc);
  const notes = notesOf(doc);

  return (
    <Paper className="p-8 text-[#1f2128] print:p-0">
      <header className="flex items-end justify-between gap-6 border-b-2 border-[#1f2128] pb-3">
        <div>
          <p className="text-[15px] font-semibold leading-tight">
            {doc.seller.companyName ?? doc.seller.name}
          </p>
          <p className="mt-0.5 text-[10.5px] leading-snug text-[#6b7079]">
            {[...doc.seller.addressLines, doc.seller.phone, doc.seller.email]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6b7079]">
            Invoice
          </p>
          <p className="font-mono text-[13px] font-semibold">{doc.number}</p>
        </div>
      </header>

      <section className="flex flex-wrap justify-between gap-x-8 gap-y-3 py-3.5 text-[11px]">
        <div>
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#8b909c]">
            Billed to
          </p>
          <p className="mt-0.5 text-[12px] font-semibold">
            {doc.buyer.companyName ?? doc.buyer.name}
          </p>
          <p className="text-[10.5px] leading-snug text-[#6b7079]">
            {[...doc.buyer.addressLines, doc.buyer.email].filter(Boolean).join(' · ')}
          </p>
          {doc.buyer.taxId ? (
            <p className="text-[10.5px] text-[#6b7079]">Tax ID: {doc.buyer.taxId}</p>
          ) : null}
        </div>

        <dl className="flex gap-6 text-[11px]">
          <Pair label="Issued" value={formatDate(doc.issueDate)} />
          <Pair label="Due" value={formatDate(doc.dueDate)} />
          {doc.reference ? <Pair label="Ref" value={doc.reference} /> : null}
          <Pair label="Status" value={doc.statusLabel} />
        </dl>
      </section>

      <table className="w-full border-collapse text-[11px]">
        <thead>
          <tr className="border-y border-[#d9dbe0] text-left text-[9.5px] uppercase tracking-[0.1em] text-[#6b7079]">
            <th className="py-1.5 font-semibold">Description</th>
            <th className="py-1.5 text-right font-semibold">Qty</th>
            <th className="py-1.5 text-right font-semibold">Price</th>
            <th className="py-1.5 text-right font-semibold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {doc.lines.map((line) => {
            const qualifiers = [
              line.discountRate > 0 ? `less ${line.discountRate}%` : null,
              line.taxRate > 0 ? `${doc.taxLabel} ${line.taxRate}%` : null,
            ].filter(Boolean);

            return (
              <tr key={line.id} className="border-b border-[#eceef1] align-top break-inside-avoid">
                <td className="py-1.5 pr-3">
                  <span className="font-medium">{line.name}</span>
                  {line.description ? (
                    <span className="text-[#6b7079]"> — {line.description}</span>
                  ) : null}
                  {qualifiers.length > 0 ? (
                    <span className="text-[#8b909c]"> ({qualifiers.join(', ')})</span>
                  ) : null}
                </td>
                <td className="py-1.5 text-right tabular-nums">{quantityOf(line)}</td>
                <td className="py-1.5 text-right tabular-nums">{money(line.unitPrice)}</td>
                <td className="py-1.5 text-right font-medium tabular-nums">
                  {money(line.lineTotal)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <section className="flex justify-end pt-3">
        <dl className="w-full max-w-[15rem] text-[11px]">
          {totalRows(doc).map((row) => (
            <div
              key={row.label}
              className={
                row.kind === 'line'
                  ? 'flex items-baseline justify-between py-0.5'
                  : 'mt-1 flex items-baseline justify-between border-t border-[#1f2128] pt-1.5'
              }
            >
              <dt className={row.kind === 'line' ? 'text-[#6b7079]' : 'font-semibold'}>
                {row.label}
              </dt>
              <dd
                className={
                  row.kind === 'line'
                    ? 'tabular-nums'
                    : 'text-[13px] font-semibold tabular-nums'
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
        <section className="mt-5 grid gap-4 border-t border-[#eceef1] pt-3.5 sm:grid-cols-3">
          {notes.map((note) => (
            <Note
              key={note.title}
              title={note.title}
              body={note.body}
              labelClassName="text-[#8b909c]"
              bodyClassName="text-[10.5px] text-[#6b7079]"
            />
          ))}
        </section>
      ) : null}

      <footer className="mt-5 text-[9.5px] text-[#8b909c]">
        {doc.footer ? <span>{doc.footer} · </span> : null}
        {doc.seller.name}
        {doc.seller.website ? ` · ${doc.seller.website}` : ''} · Generated with {brand.name}
      </footer>
    </Paper>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#8b909c]">
        {label}
      </dt>
      <dd className="mt-0.5 font-medium tabular-nums">{value}</dd>
    </div>
  );
}
