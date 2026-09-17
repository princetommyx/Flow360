/**
 * The pieces every invoice design shares.
 *
 * Deliberately small: a shared shell, a currency formatter bound to the
 * document, and the one decision no design should be allowed to make for
 * itself — which total rows apply. Everything visual belongs to the design.
 *
 * Nothing here imports from the server. The designs render in the print route
 * and, at a twelfth of the size, in the settings picker, and they have to work
 * in both.
 */

import * as React from 'react';

import { formatCurrency, formatNumber } from '@/lib/money';
import type { InvoiceDocument, InvoiceDocumentLine } from '@/lib/invoice-document';

export type InvoiceTemplateProps = {
  doc: InvoiceDocument;
};

/** Money in the invoice's own currency, never the workspace default. */
export function amountIn(doc: InvoiceDocument) {
  return (value: number) => formatCurrency(value, { currency: doc.currency });
}

/** "3 rolls", or just "3" where the line carries no unit. */
export function quantityOf(line: InvoiceDocumentLine): string {
  const count = formatNumber(line.quantity, 2);
  return line.unit ? `${count} ${line.unit}` : count;
}

export function rateOf(value: number): string {
  return value > 0 ? `${formatNumber(value, 2)}%` : '—';
}

export type TotalRow = {
  label: string;
  value: number;
  /** Rows a design may want to set apart: the total, and what is still owed. */
  kind: 'line' | 'total' | 'due';
  /** Shown as a deduction — a discount or a payment already made. */
  negative?: boolean;
};

/**
 * Which rows the totals block carries, decided once.
 *
 * A design that worked this out for itself could quietly drop the shipping
 * line, or show "Paid to date" against nothing, and the six would disagree
 * about the same invoice. The zero rows are omitted here so every design omits
 * them the same way.
 */
export function totalRows(doc: InvoiceDocument): TotalRow[] {
  const rows: TotalRow[] = [{ label: 'Subtotal', value: doc.subtotal, kind: 'line' }];

  if (doc.discountAmount > 0) {
    rows.push({
      label: 'Discount',
      value: doc.discountAmount,
      kind: 'line',
      negative: true,
    });
  }

  rows.push({ label: doc.taxLabel, value: doc.taxAmount, kind: 'line' });

  if (doc.shippingAmount > 0) {
    rows.push({ label: 'Shipping', value: doc.shippingAmount, kind: 'line' });
  }

  rows.push({ label: 'Total', value: doc.total, kind: 'total' });

  if (doc.amountPaid > 0) {
    rows.push({
      label: 'Paid to date',
      value: doc.amountPaid,
      kind: 'line',
      negative: true,
    });
    rows.push({ label: 'Amount due', value: doc.balanceDue, kind: 'due' });
  }

  return rows;
}

/**
 * The sheet itself.
 *
 * On screen it is a page on a grey desk; printed, the desk and the shadow go
 * and the sheet becomes the paper. Every design goes through this so none of
 * them can forget the print overrides.
 */
export function Paper({
  className = '',
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return (
    <article
      className={`mx-auto my-6 w-full max-w-[52rem] bg-white shadow-lg print:my-0 print:max-w-none print:shadow-none ${className}`}
      style={style}
    >
      {children}
    </article>
  );
}

/** A labelled block of free text — notes, terms, how to pay. */
export function Note({
  title,
  body,
  labelClassName = '',
  bodyClassName = '',
}: {
  title: string;
  body: string;
  labelClassName?: string;
  bodyClassName?: string;
}) {
  return (
    <div className="break-inside-avoid">
      <p className={`text-[10.5px] font-semibold uppercase tracking-[0.1em] ${labelClassName}`}>
        {title}
      </p>
      <p className={`mt-1.5 whitespace-pre-wrap text-[11.5px] leading-relaxed ${bodyClassName}`}>
        {body}
      </p>
    </div>
  );
}

/** The notes, payment instructions and terms a document actually carries. */
export function notesOf(doc: InvoiceDocument): Array<{ title: string; body: string }> {
  const blocks: Array<{ title: string; body: string }> = [];
  if (doc.notes) blocks.push({ title: 'Notes', body: doc.notes });
  if (doc.paymentInstructions) {
    blocks.push({ title: 'How to pay', body: doc.paymentInstructions });
  }
  if (doc.terms) blocks.push({ title: 'Terms', body: doc.terms });
  return blocks;
}

/**
 * Status pill colours, inlined rather than set in classes.
 *
 * Browsers drop background colours when printing unless asked not to, and a
 * status that disappears on paper is worse than none. These are foreground and
 * border only, which survive.
 */
export function badgeStyle(status: string): React.CSSProperties {
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
