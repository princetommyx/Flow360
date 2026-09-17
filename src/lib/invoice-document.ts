/**
 * An invoice, flattened into the shape the printed designs read.
 *
 * Every design renders this and nothing else. Two reasons: the templates stay
 * free of Prisma — which is what lets the settings page render live previews of
 * all six in the browser — and, more importantly, a design cannot reach past
 * this shape to recompute anything. The figures are the stored ones, so
 * changing the look of an invoice can never change what it says.
 *
 * Dates are ISO strings and money is plain numbers, so the whole document
 * crosses to a client component without a serialisation dance.
 */

import { toNumber, type DecimalLike } from '@/lib/money';
import { statusMeta } from '@/lib/status';

export type InvoiceDocumentLine = {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountRate: number;
  taxRate: number;
  lineTotal: number;
};

export type InvoiceDocumentParty = {
  name: string;
  /** The trading name, where it differs from the contact's own name. */
  companyName: string | null;
  addressLines: string[];
  taxId: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
};

export type InvoiceDocument = {
  number: string;
  status: string;
  statusLabel: string;
  currency: string;
  issueDate: string;
  dueDate: string | null;
  reference: string | null;
  notes: string | null;
  terms: string | null;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  total: number;
  amountPaid: number;
  balanceDue: number;
  /** What this workspace calls tax — VAT, GST, whatever is on the row. */
  taxLabel: string;
  paymentInstructions: string | null;
  footer: string | null;
  seller: InvoiceDocumentParty;
  buyer: InvoiceDocumentParty;
  lines: InvoiceDocumentLine[];
};

type AddressLike = {
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

/** Address fields as printable lines, with the empty ones dropped. */
export function addressLines(input: AddressLike): string[] {
  return [
    input.addressLine1,
    input.addressLine2,
    [input.city, input.state].filter(Boolean).join(', '),
    input.postalCode,
    input.country,
  ].filter((line): line is string => Boolean(line && line.trim()));
}

type InvoiceRow = {
  number: string;
  status: string;
  currency: string;
  issueDate: Date | string;
  dueDate: Date | string | null;
  reference: string | null;
  notes: string | null;
  terms: string | null;
  subtotal: DecimalLike | number;
  discountAmount: DecimalLike | number;
  taxAmount: DecimalLike | number;
  shippingAmount: DecimalLike | number;
  total: DecimalLike | number;
  amountPaid: DecimalLike | number;
  balanceDue: DecimalLike | number;
  customer: AddressLike & {
    name: string;
    companyName: string | null;
    taxId: string | null;
    email: string | null;
    phone?: string | null;
  };
  items: Array<{
    id: string;
    name: string;
    description: string | null;
    quantity: DecimalLike | number;
    unit: string | null;
    unitPrice: DecimalLike | number;
    discountRate: DecimalLike | number;
    taxRate: DecimalLike | number;
    lineTotal: DecimalLike | number;
  }>;
};

type OrganizationRow = AddressLike & {
  name: string;
  legalName: string | null;
  taxId: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
};

type SettingsRow = {
  taxLabel: string | null;
  paymentInstructions: string | null;
  invoiceFooter: string | null;
} | null;

function iso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

export function toInvoiceDocument(
  invoice: InvoiceRow,
  organization: OrganizationRow,
  settings: SettingsRow,
): InvoiceDocument {
  return {
    number: invoice.number,
    status: invoice.status,
    statusLabel: statusMeta(invoice.status).label,
    currency: invoice.currency,
    issueDate: iso(invoice.issueDate),
    dueDate: invoice.dueDate ? iso(invoice.dueDate) : null,
    reference: invoice.reference,
    notes: invoice.notes,
    terms: invoice.terms,
    subtotal: toNumber(invoice.subtotal),
    discountAmount: toNumber(invoice.discountAmount),
    taxAmount: toNumber(invoice.taxAmount),
    shippingAmount: toNumber(invoice.shippingAmount),
    total: toNumber(invoice.total),
    amountPaid: toNumber(invoice.amountPaid),
    balanceDue: toNumber(invoice.balanceDue),
    taxLabel: settings?.taxLabel ?? 'Tax',
    paymentInstructions: settings?.paymentInstructions ?? null,
    footer: settings?.invoiceFooter ?? null,
    seller: {
      name: organization.name,
      companyName: organization.legalName,
      addressLines: addressLines(organization),
      taxId: organization.taxId,
      email: organization.email,
      phone: organization.phone,
      website: organization.website,
    },
    buyer: {
      name: invoice.customer.name,
      companyName: invoice.customer.companyName,
      addressLines: addressLines(invoice.customer),
      taxId: invoice.customer.taxId,
      email: invoice.customer.email,
      phone: invoice.customer.phone ?? null,
      website: null,
    },
    lines: invoice.items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      quantity: toNumber(item.quantity),
      unit: item.unit ?? '',
      unitPrice: toNumber(item.unitPrice),
      discountRate: toNumber(item.discountRate),
      taxRate: toNumber(item.taxRate),
      lineTotal: toNumber(item.lineTotal),
    })),
  };
}
