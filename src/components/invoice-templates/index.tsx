/**
 * The registry: an id from the plan config, a component to draw it with.
 *
 * Split from `lib/config/invoice-templates.ts` on purpose. That file is data —
 * names, descriptions, which plan opens which — and is imported by the pricing
 * page, the settings action and the plan list. This one pulls in six pages of
 * JSX, and nothing that only needs to know *whether* a design is allowed
 * should have to load it.
 */

import type { ComponentType } from 'react';

import {
  DEFAULT_INVOICE_TEMPLATE,
  type InvoiceTemplateId,
} from '@/lib/config/invoice-templates';

import { BoldInvoice } from './bold';
import { ClassicInvoice } from './classic';
import { CompactInvoice } from './compact';
import { ElegantInvoice } from './elegant';
import { LetterheadInvoice } from './letterhead';
import { ModernInvoice } from './modern';
import type { InvoiceTemplateProps } from './parts';

export type { InvoiceTemplateProps } from './parts';

const COMPONENTS: Record<InvoiceTemplateId, ComponentType<InvoiceTemplateProps>> = {
  classic: ClassicInvoice,
  compact: CompactInvoice,
  modern: ModernInvoice,
  elegant: ElegantInvoice,
  bold: BoldInvoice,
  letterhead: LetterheadInvoice,
};

/**
 * Draws a document in the named design.
 *
 * An id that does not name a design falls back to the default rather than
 * rendering nothing: whoever is looking at this wants their invoice, and the
 * place to argue about the plan is the settings page, not the paper.
 */
export function InvoiceDesign({
  template,
  doc,
}: InvoiceTemplateProps & { template: string }) {
  const Design = COMPONENTS[template as InvoiceTemplateId] ?? COMPONENTS[DEFAULT_INVOICE_TEMPLATE];
  return <Design doc={doc} />;
}
