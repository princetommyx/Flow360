import { LogoMark } from '@/components/brand/logo';
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
 * Bold — the amount due set large at the top, over a dark totals panel.
 *
 * For anyone whose problem is getting paid rather than looking good. The
 * figure and the date it is wanted by are the first two things on the page and
 * the last two, and nothing else competes with them.
 */
export function BoldInvoice({ doc }: InvoiceTemplateProps) {
  const money = amountIn(doc);
  const notes = notesOf(doc);
  const settled = doc.balanceDue <= 0;

  return (
    <Paper className="px-10 py-9 text-[#111318] print:px-0 print:py-0">
      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <LogoMark size={30} />
          <div>
            <p className="text-[15px] font-bold leading-tight tracking-[-0.01em]">
              {doc.seller.name}
            </p>
            <p className="text-[11px] text-[#6b7079]">
              {[doc.seller.phone, doc.seller.email].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-[12px] font-medium text-[#6b7079]">{doc.number}</p>
          <p className="text-[11px] text-[#6b7079]">Issued {formatDate(doc.issueDate)}</p>
        </div>
      </header>

      <section className="mt-7 border-y-[3px] border-[#111318] py-7">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#6b7079]">
          {settled ? 'Paid in full' : 'Amount due'}
        </p>
        <p className="mt-1.5 text-[44px] font-bold leading-none tracking-[-0.03em] tabular-nums">
          {money(settled ? doc.total : doc.balanceDue)}
        </p>
        <p className="mt-3 text-[13px] font-medium">
          {settled
            ? `Settled — thank you.`
            : doc.dueDate
              ? `Payable by ${formatDate(doc.dueDate)}`
              : 'Payable on receipt'}
        </p>
      </section>

      <section className="grid gap-8 py-7 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b909c]">
            Billed to
          </p>
          <p className="mt-2 text-[14px] font-bold">{doc.buyer.companyName ?? doc.buyer.name}</p>
          <address className="mt-1 not-italic text-[12px] leading-relaxed text-[#6b7079]">
            {doc.buyer.companyName ? <div>{doc.buyer.name}</div> : null}
            {doc.buyer.addressLines.map((line) => (
              <div key={line}>{line}</div>
            ))}
            {doc.buyer.email ? <div>{doc.buyer.email}</div> : null}
            {doc.buyer.taxId ? <div>Tax ID: {doc.buyer.taxId}</div> : null}
          </address>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8b909c]">From</p>
          <p className="mt-2 text-[14px] font-bold">{doc.seller.companyName ?? doc.seller.name}</p>
          <address className="mt-1 not-italic text-[12px] leading-relaxed text-[#6b7079]">
            {doc.seller.addressLines.map((line) => (
              <div key={line}>{line}</div>
            ))}
            {doc.seller.taxId ? <div>Tax ID: {doc.seller.taxId}</div> : null}
            {doc.reference ? <div>Your reference: {doc.reference}</div> : null}
          </address>
        </div>
      </section>

      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="border-b-2 border-[#111318] text-left text-[10px] uppercase tracking-[0.12em]">
            <th className="py-2.5 font-bold">What for</th>
            <th className="py-2.5 text-right font-bold">Qty</th>
            <th className="py-2.5 text-right font-bold">Price</th>
            <th className="py-2.5 text-right font-bold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {doc.lines.map((line) => (
            <tr key={line.id} className="border-b border-[#e4e6ea] align-top break-inside-avoid">
              <td className="py-3 pr-4">
                <div className="font-semibold">{line.name}</div>
                {line.description ? (
                  <div className="mt-0.5 text-[11.5px] text-[#6b7079]">{line.description}</div>
                ) : null}
                {line.discountRate > 0 || line.taxRate > 0 ? (
                  <div className="mt-0.5 text-[11px] text-[#8b909c]">
                    {[
                      line.discountRate > 0 ? `${line.discountRate}% off` : null,
                      line.taxRate > 0 ? `${doc.taxLabel} ${line.taxRate}%` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                ) : null}
              </td>
              <td className="py-3 text-right tabular-nums">{quantityOf(line)}</td>
              <td className="py-3 text-right tabular-nums">{money(line.unitPrice)}</td>
              <td className="py-3 text-right font-semibold tabular-nums">
                {money(line.lineTotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="mt-7 flex justify-end">
        <dl
          className="w-full max-w-[19rem] space-y-2 rounded-lg bg-[#111318] px-6 py-5 text-[12.5px] text-white"
          style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
        >
          {totalRows(doc).map((row) => (
            <div
              key={row.label}
              className={
                row.kind === 'line'
                  ? 'flex items-baseline justify-between'
                  : 'flex items-baseline justify-between border-t border-white/25 pt-2.5'
              }
            >
              <dt className={row.kind === 'line' ? 'text-white/70' : 'font-bold'}>{row.label}</dt>
              <dd
                className={
                  row.kind === 'line'
                    ? 'tabular-nums text-white/90'
                    : 'text-[17px] font-bold tabular-nums'
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
        <section className="mt-8 grid gap-6 border-t border-[#e4e6ea] pt-6 sm:grid-cols-2">
          {notes.map((note) => (
            <Note
              key={note.title}
              title={note.title}
              body={note.body}
              labelClassName="text-[#8b909c]"
              bodyClassName="text-[#6b7079]"
            />
          ))}
        </section>
      ) : null}

      <footer className="mt-8 text-[10.5px] text-[#8b909c]">
        {doc.footer ? <p className="font-medium text-[#6b7079]">{doc.footer}</p> : null}
        <p className="mt-1">
          {doc.seller.name}
          {doc.seller.website ? ` · ${doc.seller.website}` : ''} · Generated with {brand.name}
        </p>
      </footer>
    </Paper>
  );
}
