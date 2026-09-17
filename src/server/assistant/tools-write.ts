import 'server-only';

import { addDays } from 'date-fns';
import { z } from 'zod';

import { db } from '@/lib/db';
import { calculateDocumentTotals, calculatePayslip, formatCurrency, round, toNumber } from '@/lib/money';
import { customerSchema } from '@/lib/validations/customer';
import { invoiceSchema, quotationSchema, recordPaymentSchema } from '@/lib/validations/document';
import { attendanceSchema, employeeSchema, payrollSchema } from '@/lib/validations/employee';
import {
  dateString,
  defineTool,
  isoDate,
  resolveCustomer,
  resolveEmployee,
  resolveProduct,
  stageProposal,
  toolError,
  type ProposalPreview,
  type ToolContext,
  type ToolResult,
} from '@/server/assistant/context';

/**
 * The tools that would change something — and therefore do not.
 *
 * Each one does the work of the form it stands in for: resolves the names,
 * fills in what was left out, runs the same Zod schema the screen runs, and
 * totals the document with the same function the invoice page uses. What it
 * produces is that form, filled in, waiting for somebody to press the button.
 *
 * Nothing here calls a server action. Confirmation does, and that is the only
 * path by which any of this reaches the database — so stock checks, numbering,
 * notifications and the activity log all happen exactly as they do when a
 * person fills the form in themselves.
 */

const fmt = (value: number, context: ToolContext) =>
  formatCurrency(value, { currency: context.currency });

/** A schema failure phrased for the model rather than for a form field. */
function refuse(error: z.ZodError, what: string): ToolResult {
  const issue = error.issues[0];
  const where = issue?.path.length ? ` (${issue.path.join('.')})` : '';
  return toolError(`That ${what} is not valid${where}: ${issue?.message ?? 'check the details'}.`);
}

/* ── Documents ────────────────────────────────────────────────────────────── */

const lineInput = z.object({
  product: z
    .string()
    .max(120)
    .optional()
    .describe('An existing product, by code or name. Its price, unit and tax rate are used unless overridden.'),
  description: z
    .string()
    .max(160)
    .optional()
    .describe('Free text for a line with no product behind it. Required when product is omitted.'),
  quantity: z.number().gt(0).max(999_999),
  unitPrice: z.number().min(0).max(99_999_999).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  discountRate: z.number().min(0).max(100).optional(),
});

type LineInput = z.infer<typeof lineInput>;

type BuiltLine = {
  productId: string | null;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountRate: number;
  taxRate: number;
};

/**
 * Lines, with everything the caller left out filled in from the product.
 *
 * A price is only ever defaulted, never overridden: if the model was told
 * "180 each" that is what goes on the document, and the catalogue price is
 * what it falls back to when nobody said.
 */
async function buildLines(
  lines: LineInput[],
  context: ToolContext,
): Promise<{ ok: true; lines: BuiltLine[]; notes: string[] } | { ok: false; message: string }> {
  const built: BuiltLine[] = [];
  const notes: string[] = [];

  for (const line of lines) {
    if (!line.product && !line.description) {
      return { ok: false, message: 'Every line needs either a product or a description.' };
    }

    if (!line.product) {
      if (line.unitPrice === undefined) {
        return {
          ok: false,
          message: `The line “${line.description}” has no product behind it, so it needs a unit price.`,
        };
      }
      built.push({
        productId: null,
        name: line.description!,
        description: '',
        quantity: line.quantity,
        unit: 'unit',
        unitPrice: line.unitPrice,
        discountRate: line.discountRate ?? 0,
        taxRate: line.taxRate ?? 0,
      });
      continue;
    }

    const found = await resolveProduct(line.product, context);
    if (!found.ok) return { ok: false, message: found.message };
    const product = found.row;

    if (product.status === 'BLOCKED') {
      return { ok: false, message: `${product.name} is blocked and cannot be sold.` };
    }

    if (
      product.trackInventory &&
      toNumber(product.stockQuantity) < line.quantity
    ) {
      notes.push(
        `Only ${toNumber(product.stockQuantity)} ${product.unit} of ${product.name} in stock, against ${line.quantity} on this document.`,
      );
    }

    built.push({
      productId: product.id,
      name: line.description || product.name,
      description: '',
      quantity: line.quantity,
      unit: product.unit,
      unitPrice: line.unitPrice ?? toNumber(product.sellingPrice),
      discountRate: line.discountRate ?? 0,
      taxRate: line.taxRate ?? toNumber(product.taxRate),
    });
  }

  return { ok: true, lines: built, notes };
}

function documentPreview(
  title: string,
  subtitle: string,
  rows: Array<{ label: string; value: string }>,
  lines: BuiltLine[],
  context: ToolContext,
  confirmLabel: string,
  warning?: string,
): ProposalPreview {
  const totals = calculateDocumentTotals({
    lines: lines.map((line) => ({
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      discountRate: line.discountRate,
      taxRate: line.taxRate,
    })),
    discountType: 'PERCENTAGE',
    discountValue: 0,
  });

  return {
    title,
    subtitle,
    rows: [
      ...rows,
      { label: 'Subtotal', value: fmt(totals.subtotal, context) },
      ...(totals.taxAmount > 0
        ? [{ label: 'Tax', value: fmt(totals.taxAmount, context) }]
        : []),
    ],
    lines: lines.map((line, index) => ({
      label: line.name,
      detail: `${line.quantity} ${line.unit} × ${fmt(line.unitPrice, context)}${
        line.taxRate > 0 ? ` · ${line.taxRate}% tax` : ''
      }`,
      amount: fmt(totals.lines[index].lineTotal, context),
    })),
    total: { label: 'Total', value: fmt(totals.total, context) },
    warning,
    confirmLabel,
  };
}

export const draftInvoice = defineTool({
  name: 'draft_invoice',
  description:
    'Draft an invoice for a customer. It is NOT created — it is shown to the person for them to confirm. Say that you have drafted it and that they need to confirm it.',
  permission: 'invoices.create',
  writes: true,
  schema: z.object({
    customer: z.string().min(1).max(120).describe('An existing customer, by name'),
    lines: z.array(lineInput).min(1).max(50),
    issueDate: dateString.optional().describe('Defaults to today'),
    dueDate: dateString.optional().describe("Defaults to the customer's payment terms"),
    reference: z.string().max(80).optional().describe('Their order number'),
    notes: z.string().max(2000).optional(),
  }),
  async run(input, context) {
    const found = await resolveCustomer(input.customer, context);
    if (!found.ok) return toolError(found.message);
    const customer = found.row;

    if (customer.status === 'BLOCKED') {
      return toolError(`${customer.name} is blocked and cannot be invoiced.`);
    }

    const lines = await buildLines(input.lines, context);
    if (!lines.ok) return toolError(lines.message);

    const issueDate = input.issueDate ?? isoDate(context.now);
    const dueDate =
      input.dueDate ?? isoDate(addDays(new Date(issueDate), customer.paymentTermDays));

    const payload = {
      customerId: customer.id,
      issueDate,
      dueDate,
      discountType: 'PERCENTAGE' as const,
      discountValue: 0,
      shippingAmount: 0,
      reference: input.reference ?? '',
      notes: input.notes ?? '',
      terms: '',
      projectId: null,
      items: lines.lines,
    };

    const parsed = invoiceSchema.safeParse(payload);
    if (!parsed.success) return refuse(parsed.error, 'invoice');

    const preview = documentPreview(
      `Invoice for ${customer.name}`,
      `Issued ${issueDate} · due ${dueDate}`,
      [
        { label: 'Customer', value: customer.name },
        { label: 'Issue date', value: issueDate },
        { label: 'Due date', value: dueDate },
        ...(input.reference ? [{ label: 'Their reference', value: input.reference }] : []),
      ],
      lines.lines,
      context,
      'Create the invoice',
      lines.notes.join(' ') || undefined,
    );

    return stageProposal(
      context,
      'invoice.create',
      parsed.data,
      preview,
      `A draft invoice for ${customer.name} totalling ${preview.total?.value} is waiting for them to confirm. It does not exist yet.`,
    );
  },
});

export const draftQuotation = defineTool({
  name: 'draft_quotation',
  description:
    'Draft a quotation for a customer. It is NOT created — it is shown to the person for them to confirm.',
  permission: 'quotations.create',
  writes: true,
  schema: z.object({
    customer: z.string().min(1).max(120),
    lines: z.array(lineInput).min(1).max(50),
    issueDate: dateString.optional().describe('Defaults to today'),
    expiryDate: dateString.optional().describe('Defaults to 30 days after the issue date'),
    notes: z.string().max(2000).optional(),
  }),
  async run(input, context) {
    const found = await resolveCustomer(input.customer, context);
    if (!found.ok) return toolError(found.message);
    const customer = found.row;

    const lines = await buildLines(input.lines, context);
    if (!lines.ok) return toolError(lines.message);

    const issueDate = input.issueDate ?? isoDate(context.now);
    const expiryDate = input.expiryDate ?? isoDate(addDays(new Date(issueDate), 30));

    const payload = {
      customerId: customer.id,
      issueDate,
      expiryDate,
      discountType: 'PERCENTAGE' as const,
      discountValue: 0,
      notes: input.notes ?? '',
      terms: '',
      items: lines.lines,
    };

    const parsed = quotationSchema.safeParse(payload);
    if (!parsed.success) return refuse(parsed.error, 'quotation');

    const preview = documentPreview(
      `Quotation for ${customer.name}`,
      `Issued ${issueDate} · valid until ${expiryDate}`,
      [
        { label: 'Customer', value: customer.name },
        { label: 'Issue date', value: issueDate },
        { label: 'Valid until', value: expiryDate },
      ],
      lines.lines,
      context,
      'Create the quotation',
      // A quotation reserves nothing, so a short stock level is not a warning
      // worth raising on one.
      undefined,
    );

    return stageProposal(
      context,
      'quotation.create',
      parsed.data,
      preview,
      `A draft quotation for ${customer.name} totalling ${preview.total?.value} is waiting for them to confirm. It does not exist yet.`,
    );
  },
});

/* ── Customers ────────────────────────────────────────────────────────────── */

export const draftCustomer = defineTool({
  name: 'draft_customer',
  description:
    'Draft a new customer record. It is NOT created — it is shown to the person for them to confirm.',
  permission: 'customers.create',
  writes: true,
  schema: z.object({
    name: z.string().min(2).max(80),
    company: z.string().max(120).optional(),
    email: z.string().max(160).optional(),
    phone: z.string().max(40).optional(),
    address: z.string().max(160).optional(),
    city: z.string().max(80).optional(),
    country: z.string().max(80).optional(),
    paymentTermDays: z.number().int().min(0).max(365).optional(),
    notes: z.string().max(2000).optional(),
  }),
  async run(input, context) {
    const existing = await db.customer.findFirst({
      where: {
        organizationId: context.organizationId,
        deletedAt: null,
        OR: [
          { name: { equals: input.name, mode: 'insensitive' } },
          ...(input.email ? [{ email: { equals: input.email, mode: 'insensitive' as const } }] : []),
        ],
      },
      select: { name: true },
    });
    if (existing) {
      return toolError(
        `There is already a customer called ${existing.name}. Use that one, or give a name that distinguishes the new record.`,
      );
    }

    const payload = {
      name: input.name,
      companyName: input.company ?? '',
      email: input.email ?? '',
      phone: input.phone ?? '',
      website: '',
      taxId: '',
      addressLine1: input.address ?? '',
      addressLine2: '',
      city: input.city ?? '',
      state: '',
      postalCode: '',
      country: input.country ?? '',
      creditLimit: null,
      paymentTermDays: input.paymentTermDays ?? 14,
      notes: input.notes ?? '',
      tags: [],
      status: 'ACTIVE' as const,
    };

    const parsed = customerSchema.safeParse(payload);
    if (!parsed.success) return refuse(parsed.error, 'customer');

    const preview: ProposalPreview = {
      title: `New customer: ${input.name}`,
      rows: [
        { label: 'Name', value: input.name },
        ...(input.company ? [{ label: 'Company', value: input.company }] : []),
        ...(input.email ? [{ label: 'Email', value: input.email }] : []),
        ...(input.phone ? [{ label: 'Phone', value: input.phone }] : []),
        ...(input.city ? [{ label: 'City', value: input.city }] : []),
        { label: 'Payment terms', value: `${payload.paymentTermDays} days` },
      ],
      confirmLabel: 'Add the customer',
    };

    return stageProposal(
      context,
      'customer.create',
      parsed.data,
      preview,
      `A new customer record for ${input.name} is waiting for them to confirm. It does not exist yet.`,
    );
  },
});

/* ── Money in ─────────────────────────────────────────────────────────────── */

export const draftPayment = defineTool({
  name: 'draft_payment',
  description:
    'Draft a payment received against an invoice. It is NOT recorded — it is shown to the person for them to confirm. Leave the amount out to settle the whole balance.',
  permission: 'payments.create',
  writes: true,
  schema: z.object({
    invoiceNumber: z.string().min(1).max(60),
    amount: z.number().gt(0).max(99_999_999).optional().describe('Defaults to the balance owing'),
    method: z
      .enum(['CASH', 'BANK_TRANSFER', 'CARD', 'CHECK', 'MOBILE_MONEY', 'ONLINE', 'OTHER'])
      .optional()
      .describe('Defaults to cash'),
    paidAt: dateString.optional().describe('Defaults to today'),
    account: z.string().max(80).optional().describe('Which account it went into, by name'),
    reference: z.string().max(80).optional(),
  }),
  async run(input, context) {
    const invoice = await db.invoice.findFirst({
      where: {
        organizationId: context.organizationId,
        deletedAt: null,
        number: { equals: input.invoiceNumber, mode: 'insensitive' },
      },
      select: {
        id: true,
        number: true,
        status: true,
        balanceDue: true,
        total: true,
        customer: { select: { name: true } },
      },
    });

    if (!invoice) return toolError(`There is no invoice numbered ${input.invoiceNumber} here.`);
    if (invoice.status === 'DRAFT') {
      return toolError(
        `Invoice ${invoice.number} is still a draft. It has to be sent before a payment can go against it.`,
      );
    }
    if (invoice.status === 'CANCELLED') {
      return toolError(`Invoice ${invoice.number} was cancelled.`);
    }

    const owing = toNumber(invoice.balanceDue);
    if (owing <= 0) {
      return toolError(`Invoice ${invoice.number} is already fully paid.`);
    }

    const amount = round(input.amount ?? owing);
    if (amount > owing) {
      return toolError(
        `Only ${fmt(owing, context)} is owing on invoice ${invoice.number}, and the payment offered is ${fmt(amount, context)}.`,
      );
    }

    const accounts = await db.account.findMany({
      where: { organizationId: context.organizationId, deletedAt: null, isActive: true },
      orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
      select: { id: true, name: true, type: true, isPrimary: true },
    });
    if (accounts.length === 0) {
      return toolError('This workspace has no account for the money to go into.');
    }

    const account = input.account
      ? accounts.find((row) => row.name.toLowerCase().includes(input.account!.toLowerCase()))
      : (accounts.find((row) => row.isPrimary) ?? accounts[0]);
    if (!account) {
      return toolError(
        `There is no account called “${input.account}”. The accounts here are: ${accounts.map((a) => a.name).join(', ')}.`,
      );
    }

    const payload = {
      invoiceId: invoice.id,
      amount,
      method: input.method ?? ('CASH' as const),
      accountId: account.id,
      paidAt: input.paidAt ?? isoDate(context.now),
      reference: input.reference ?? '',
      notes: '',
    };

    const parsed = recordPaymentSchema.safeParse(payload);
    if (!parsed.success) return refuse(parsed.error, 'payment');

    const preview: ProposalPreview = {
      title: `Payment of ${fmt(amount, context)} from ${invoice.customer.name}`,
      subtitle: `Against invoice ${invoice.number}`,
      rows: [
        { label: 'Invoice', value: invoice.number },
        { label: 'Owing before', value: fmt(owing, context) },
        { label: 'Method', value: payload.method.replace(/_/g, ' ').toLowerCase() },
        { label: 'Into', value: account.name },
        { label: 'Date', value: payload.paidAt },
      ],
      total: { label: 'Leaves owing', value: fmt(round(owing - amount), context) },
      confirmLabel: 'Record the payment',
    };

    return stageProposal(
      context,
      'payment.record',
      parsed.data,
      preview,
      `A payment of ${fmt(amount, context)} against invoice ${invoice.number} is waiting for them to confirm. It has not been recorded yet.`,
    );
  },
});

/* ── People ───────────────────────────────────────────────────────────────── */

export const draftAttendance = defineTool({
  name: 'draft_attendance',
  description:
    'Draft a day of attendance for one member of staff. It is NOT saved — it is shown to the person for them to confirm.',
  permission: 'attendance.create',
  writes: true,
  schema: z.object({
    employee: z.string().min(1).max(80),
    date: dateString.optional().describe('Defaults to today'),
    status: z.enum(['PRESENT', 'LATE', 'HALF_DAY', 'ABSENT', 'LEAVE', 'HOLIDAY']),
    hours: z.number().min(0).max(24).optional().describe('Defaults to 8 for a full day worked'),
    checkIn: z.string().max(5).optional().describe('24-hour time, e.g. 08:30'),
    checkOut: z.string().max(5).optional(),
    notes: z.string().max(500).optional(),
  }),
  async run(input, context) {
    const found = await resolveEmployee(input.employee, context);
    if (!found.ok) return toolError(found.message);
    const employee = found.row;

    const date = input.date ?? isoDate(context.now);
    const worked = input.status === 'PRESENT' || input.status === 'LATE';
    const hours = input.hours ?? (worked ? 8 : input.status === 'HALF_DAY' ? 4 : 0);

    const payload = {
      employeeId: employee.id,
      date,
      status: input.status,
      checkIn: input.checkIn ?? '',
      checkOut: input.checkOut ?? '',
      hoursWorked: hours,
      notes: input.notes ?? '',
    };

    const parsed = attendanceSchema.safeParse(payload);
    if (!parsed.success) return refuse(parsed.error, 'attendance day');

    const name = `${employee.firstName} ${employee.lastName}`;
    const existing = await db.attendance.findFirst({
      where: { organizationId: context.organizationId, employeeId: employee.id, date: new Date(date) },
      select: { status: true },
    });

    const preview: ProposalPreview = {
      title: `${name} — ${input.status.replace(/_/g, ' ').toLowerCase()}`,
      subtitle: date,
      rows: [
        { label: 'Employee', value: name },
        { label: 'Date', value: date },
        { label: 'Status', value: input.status.replace(/_/g, ' ').toLowerCase() },
        { label: 'Hours', value: String(hours) },
        ...(input.checkIn ? [{ label: 'In', value: input.checkIn }] : []),
        ...(input.checkOut ? [{ label: 'Out', value: input.checkOut }] : []),
      ],
      warning: existing
        ? `That day is already recorded as ${existing.status.replace(/_/g, ' ').toLowerCase()}. Confirming replaces it.`
        : undefined,
      confirmLabel: 'Save the day',
    };

    return stageProposal(
      context,
      'attendance.save',
      parsed.data,
      preview,
      `An attendance day for ${name} on ${date} is waiting for them to confirm. It has not been saved yet.`,
    );
  },
});

export const draftEmployee = defineTool({
  name: 'draft_employee',
  description:
    'Draft a new member of staff. It is NOT created — it is shown to the person for them to confirm.',
  permission: 'employees.create',
  writes: true,
  schema: z.object({
    firstName: z.string().min(1).max(80),
    lastName: z.string().min(1).max(80),
    email: z.string().max(160),
    phone: z.string().max(40).optional(),
    position: z.string().max(80).optional(),
    department: z.string().max(80).optional(),
    employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']).optional(),
    status: z.enum(['ACTIVE', 'PROBATION', 'ON_LEAVE']).optional(),
    startDate: dateString.optional().describe('Defaults to today'),
    baseSalary: z.number().min(0).max(99_999_999).describe('Per pay period, before deductions'),
  }),
  async run(input, context) {
    const payload = {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone ?? '',
      department: input.department ?? '',
      position: input.position ?? '',
      employmentType: input.employmentType ?? ('FULL_TIME' as const),
      status: input.status ?? ('ACTIVE' as const),
      hiredAt: input.startDate ?? isoDate(context.now),
      terminatedAt: '',
      baseSalary: input.baseSalary,
      addressLine1: '',
      city: '',
      country: '',
      bankAccount: '',
      taxNumber: '',
      notes: '',
    };

    const parsed = employeeSchema.safeParse(payload);
    if (!parsed.success) return refuse(parsed.error, 'employee');

    const name = `${input.firstName} ${input.lastName}`;
    const preview: ProposalPreview = {
      title: `New employee: ${name}`,
      rows: [
        { label: 'Name', value: name },
        { label: 'Email', value: payload.email },
        ...(payload.position ? [{ label: 'Position', value: payload.position }] : []),
        ...(payload.department ? [{ label: 'Department', value: payload.department }] : []),
        { label: 'Employment', value: payload.employmentType.replace(/_/g, ' ').toLowerCase() },
        { label: 'Status', value: payload.status.replace(/_/g, ' ').toLowerCase() },
        { label: 'Starts', value: payload.hiredAt },
        { label: 'Base salary', value: fmt(input.baseSalary, context) },
      ],
      confirmLabel: 'Add the employee',
    };

    return stageProposal(
      context,
      'employee.create',
      parsed.data,
      preview,
      `A new staff record for ${name} is waiting for them to confirm. It does not exist yet.`,
    );
  },
});

export const draftPayslip = defineTool({
  name: 'draft_payslip',
  description:
    'Draft one payslip for one member of staff for a period. It is NOT created, approved or paid — it is shown to the person for them to confirm, and it is created as a draft even then. Base pay comes from their record unless given.',
  permission: 'payroll.create',
  writes: true,
  schema: z.object({
    employee: z.string().min(1).max(80),
    periodStart: dateString,
    periodEnd: dateString,
    baseSalary: z.number().min(0).max(99_999_999).optional().describe('Defaults to their salary'),
    allowances: z.number().min(0).max(99_999_999).optional(),
    overtime: z.number().min(0).max(99_999_999).optional(),
    bonus: z.number().min(0).max(99_999_999).optional(),
    taxDeduction: z.number().min(0).max(99_999_999).optional(),
    otherDeduction: z.number().min(0).max(99_999_999).optional(),
    notes: z.string().max(1000).optional(),
  }),
  async run(input, context) {
    const found = await resolveEmployee(input.employee, context);
    if (!found.ok) return toolError(found.message);
    const employee = found.row;

    if (employee.status === 'TERMINATED') {
      return toolError(`${employee.firstName} ${employee.lastName} has left, so has no payslip due.`);
    }

    const existing = await db.payroll.findFirst({
      where: {
        organizationId: context.organizationId,
        employeeId: employee.id,
        periodStart: new Date(input.periodStart),
        periodEnd: new Date(input.periodEnd),
        deletedAt: null,
      },
      select: { number: true, status: true },
    });
    if (existing) {
      return toolError(
        `${employee.firstName} ${employee.lastName} already has payslip ${existing.number} for that period (${existing.status.toLowerCase()}).`,
      );
    }

    const payload = {
      employeeId: employee.id,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      baseSalary: input.baseSalary ?? toNumber(employee.baseSalary),
      allowances: input.allowances ?? 0,
      overtime: input.overtime ?? 0,
      bonus: input.bonus ?? 0,
      taxDeduction: input.taxDeduction ?? 0,
      otherDeduction: input.otherDeduction ?? 0,
      notes: input.notes ?? '',
    };

    const parsed = payrollSchema.safeParse(payload);
    if (!parsed.success) return refuse(parsed.error, 'payslip');

    const totals = calculatePayslip(payload);
    const name = `${employee.firstName} ${employee.lastName}`;

    const preview: ProposalPreview = {
      title: `Payslip for ${name}`,
      subtitle: `${input.periodStart} to ${input.periodEnd}`,
      rows: [
        { label: 'Base pay', value: fmt(payload.baseSalary, context) },
        ...(payload.allowances ? [{ label: 'Allowances', value: fmt(payload.allowances, context) }] : []),
        ...(payload.overtime ? [{ label: 'Overtime', value: fmt(payload.overtime, context) }] : []),
        ...(payload.bonus ? [{ label: 'Bonus', value: fmt(payload.bonus, context) }] : []),
        { label: 'Gross', value: fmt(totals.gross, context) },
        ...(payload.taxDeduction ? [{ label: 'Tax', value: `− ${fmt(payload.taxDeduction, context)}` }] : []),
        ...(payload.otherDeduction
          ? [{ label: 'Other deductions', value: `− ${fmt(payload.otherDeduction, context)}` }]
          : []),
      ],
      total: { label: 'Net pay', value: fmt(totals.net, context) },
      warning:
        'Confirming raises it as a draft payslip. Nobody is paid until it is approved and marked paid on the payroll page.',
      confirmLabel: 'Raise the payslip',
    };

    return stageProposal(
      context,
      'payroll.create',
      parsed.data,
      preview,
      `A draft payslip for ${name} with net pay of ${fmt(totals.net, context)} is waiting for them to confirm. Nothing has been raised or paid.`,
    );
  },
});

export const WRITE_TOOLS = [
  draftInvoice,
  draftQuotation,
  draftCustomer,
  draftPayment,
  draftAttendance,
  draftEmployee,
  draftPayslip,
];
