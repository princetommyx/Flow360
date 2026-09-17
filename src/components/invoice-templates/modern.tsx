import { LogoMark } from '@/components/brand/logo';
import { brand } from '@/lib/config/brand';
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
 * Modern — a coloured band across the top with the amount due beside it.
 *
 * The band is `print-color-adjust: exact`, which is what stops a browser
 * helpfully stripping it on the way to the printer. The one place a colour is
 * load-bearing, so the one place it is worth insisting on.
 */
export function ModernInvoice({ doc }: InvoiceTemplateProps) {
  const money = amountIn(doc);
  const notes = notesOf(doc);
  const accent = brand.colors.primary;
  // A settled invoice has no amount due, and a band announcing 0.00 in 26px
  // reads as a fault. It says what is true instead.
  const settled = doc.balanceDue <= 0;

  return (
    <Paper className="overflow-hidden text-[#1a1c23] print:overflow-visible">
      <header
        className="flex items-start justify-between gap-8 px-10 py-8 text-white"
        style={{ backgroundColor: accent, printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <LogoMark size={32} />
            <span className="text-[17px] font-semibold tracking-[-0.02em]">
              {doc.seller.name}
            </span>
          </div>
          <p className="mt-2.5 text-[11.5px] leading-relaxed text-white/80">
            {[...doc.seller.addressLines, doc.seller.phone, doc.seller.email]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-white/75">
            {settled ? 'Paid in full' : 'Amount due'}
          </p>
          <p className="mt-1 text-[26px] font-semibold leading-none tabular-nums">
            {money(settled ? doc.total : doc.balanceDue)}
          </p>
          <p className="mt-2 text-[11.5px] text-white/80">
            {settled
              ? 'Thank you'
              : doc.dueDate
                ? `Due ${formatDate(doc.dueDate)}`
                : 'Due on receipt'}
          </p>
        </div>
      </header>

      <div className="px-10 pb-10 pt-8 print:px-0 print:pb-0">
        <section className="flex flex-wrap items-start justify-between gap-8 pb-7">
          <div>
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#8b909c]">
              Billed to
            </p>
            <p className="mt-2 text-[14.5px] font-semibold">
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

          <dl className="grid grid-cols-2 gap-x-7 gap-y-3 text-[12px]">
            <Field label="Invoice" value={doc.number} mono />
            <Field label="Status" value={doc.statusLabel} />
            <Field label="Issued" value={formatDate(doc.issueDate)} />
            <Field label="Due" value={formatDate(doc.dueDate)} />
            {doc.reference ? <Field label="Reference" value={doc.reference} /> : null}
          </dl>
        </section>

        <table className="w-full border-collapse text-[12.5px]">
          <thead>
            <tr
              className="text-left text-[10.5px] uppercase tracking-[0.08em]"
              style={{ color: accent }}
            >
              <th className="border-b-2 py-2.5 font-semibold" style={{ borderColor: accent }}>
                Description
              </th>
              <th
                className="border-b-2 py-2.5 text-right font-semibold"
                style={{ borderColor: accent }}
              >
                Qty
              </th>
              <th
                className="border-b-2 py-2.5 text-right font-semibold"
                style={{ borderColor: accent }}
              >
                Unit price
              </th>
              <th
                className="border-b-2 py-2.5 text-right font-semibold"
                style={{ borderColor: accent }}
              >
                Tax
              </th>
              <th
                className="border-b-2 py-2.5 text-right font-semibold"
                style={{ borderColor: accent }}
              >
                Amount
              </th>
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
                <td className="py-3 text-right font-medium tabular-nums">
                  {money(line.lineTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <section className="flex justify-end pt-6">
          <dl className="w-full max-w-[18rem] space-y-2 rounded-xl bg-[#f6f7f9] px-5 py-4 text-[12.5px] print:bg-transparent print:px-0">
            {totalRows(doc).map((row) => (
              <div
                key={row.label}
                className={
                  row.kind === 'line'
                    ? 'flex items-baseline justify-between'
                    : 'flex items-baseline justify-between border-t border-[#dcdee3] pt-2.5'
                }
              >
                <dt className={row.kind === 'line' ? 'text-[#5a5f6d]' : 'font-semibold'}>
                  {row.label}
                </dt>
                <dd
                  className="tabular-nums"
                  style={
                    row.kind === 'due'
                      ? { color: accent, fontWeight: 600, fontSize: '15px' }
                      : row.kind === 'total'
                        ? { fontWeight: 600, fontSize: '15px' }
                        : undefined
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
          <section className="mt-8 grid gap-6 border-t border-[#e6e7eb] pt-6 sm:grid-cols-2">
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

        <footer className="mt-8 text-center text-[11px] text-[#8b909c]">
          {doc.footer ? <p>{doc.footer}</p> : null}
          <p className="mt-1">
            {doc.seller.companyName ?? doc.seller.name}
            {doc.seller.taxId ? ` · Tax ID ${doc.seller.taxId}` : ''}
            {doc.seller.website ? ` · ${doc.seller.website}` : ''} · Generated with {brand.name}
          </p>
        </footer>
      </div>
    </Paper>
  );
}

function Field({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8b909c]">
        {label}
      </dt>
      <dd className={mono ? 'mt-0.5 font-mono font-medium' : 'mt-0.5 font-medium'}>{value}</dd>
    </div>
  );
}
