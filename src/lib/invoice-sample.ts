/**
 * A made-up invoice, for showing what a design looks like.
 *
 * The customer and the lines are invented; everything around them — the
 * business's own name and address, the tax label, the payment instructions,
 * the footer — is the workspace's real settings, because those are what the
 * person choosing actually wants to see on the page.
 *
 * The dates are fixed rather than relative to today. A preview is not telling
 * anyone what day it is, and a date computed at render would differ between the
 * server pass and the browser's.
 */

import type { InvoiceDocument, InvoiceDocumentParty } from '@/lib/invoice-document';

const LINES: InvoiceDocument['lines'] = [
  {
    id: 'sample-1',
    name: 'Cotton wax print',
    description: 'Full six-yard piece, indigo',
    quantity: 12,
    unit: 'pcs',
    unitPrice: 185,
    discountRate: 0,
    taxRate: 15,
    lineTotal: 2553,
  },
  {
    id: 'sample-2',
    name: 'Tailoring',
    description: 'Cutting and finishing, per piece',
    quantity: 12,
    unit: 'pcs',
    unitPrice: 60,
    discountRate: 10,
    taxRate: 15,
    lineTotal: 745.2,
  },
  {
    id: 'sample-3',
    name: 'Delivery to Kumasi',
    description: null,
    quantity: 1,
    unit: '',
    unitPrice: 150,
    discountRate: 0,
    taxRate: 0,
    lineTotal: 150,
  },
];

export function sampleInvoiceDocument(input: {
  seller: InvoiceDocumentParty;
  currency: string;
  taxLabel: string;
  paymentInstructions: string | null;
  footer: string | null;
}): InvoiceDocument {
  return {
    number: 'INV-2026-00042',
    status: 'PARTIALLY_PAID',
    statusLabel: 'Part paid',
    currency: input.currency,
    issueDate: '2026-03-04T00:00:00.000Z',
    dueDate: '2026-03-18T00:00:00.000Z',
    reference: 'PO-2291',
    notes: 'Goods remain ours until paid for in full.',
    terms: 'Payment within 14 days of the invoice date.',
    subtotal: 3168,
    discountAmount: 72,
    taxAmount: 430.2,
    shippingAmount: 0,
    total: 3448.2,
    amountPaid: 1500,
    balanceDue: 1948.2,
    taxLabel: input.taxLabel,
    paymentInstructions: input.paymentInstructions,
    footer: input.footer,
    seller: input.seller,
    buyer: {
      name: 'Ama Boateng',
      companyName: 'Adom Fabrics Ltd',
      addressLines: ['14 Ring Road East', 'Osu', 'Accra', 'Ghana'],
      taxId: 'C0012345678',
      email: 'ama@adomfabrics.example',
      phone: null,
      website: null,
    },
    lines: LINES,
  };
}
