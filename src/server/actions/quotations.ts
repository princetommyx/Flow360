'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { quotationSchema, type QuotationInput } from '@/lib/validations/document';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { logActivity } from '@/server/activity';
import { nextDocumentNumber } from '@/server/numbering';
import { totalsFor } from '@/server/services/quotations';
import { actionError, actionOk, type ActionResult } from '@/server/actions/types';
import { toNumber } from '@/lib/money';
import type { QuotationStatus } from '@/generated/prisma/enums';

function lineRows(data: QuotationInput) {
  const totals = totalsFor(data);
  return {
    totals,
    rows: data.items.map((item, index) => ({
      productId: item.productId || null,
      name: item.name,
      description: item.description || null,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      discountRate: item.discountRate,
      taxRate: item.taxRate,
      lineSubtotal: totals.lines[index].lineSubtotal,
      lineDiscount: totals.lines[index].lineDiscount,
      lineTax: totals.lines[index].lineTax,
      lineTotal: totals.lines[index].lineTotal,
      sortOrder: index,
    })),
  };
}

export async function createQuotationAction(
  input: unknown,
  options?: { send?: boolean },
): Promise<ActionResult<{ id: string; number: string }>> {
  try {
    const { organization, user } = await requirePermission('quotations.create');

    const parsed = quotationSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the quotation details.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;

    const customer = await db.customer.findFirst({
      where: { id: data.customerId, organizationId: organization.id, deletedAt: null },
      select: { id: true, name: true, status: true },
    });
    if (!customer) return actionError('That customer no longer exists.', 'customerId');
    if (customer.status === 'BLOCKED') {
      return actionError('That customer is blocked and cannot be quoted.', 'customerId');
    }

    const { totals, rows } = lineRows(data);
    const status: QuotationStatus = options?.send ? 'SENT' : 'DRAFT';

    const quotation = await db.$transaction(async (tx) => {
      const number = await nextDocumentNumber(tx, organization.id, 'quotation', {
        date: new Date(data.issueDate),
      });

      return tx.quotation.create({
        data: {
          organizationId: organization.id,
          customerId: customer.id,
          number,
          status,
          issueDate: new Date(data.issueDate),
          expiryDate: new Date(data.expiryDate),
          currency: organization.currency,
          subtotal: totals.subtotal,
          discountType: data.discountType,
          discountValue: data.discountValue,
          discountAmount: totals.discountAmount,
          taxAmount: totals.taxAmount,
          total: totals.total,
          notes: data.notes || null,
          terms: data.terms || null,
          sentAt: options?.send ? new Date() : null,
          createdById: user.id,
          items: { create: rows },
        },
        select: { id: true, number: true },
      });
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'create',
      entityType: 'quotation',
      entityId: quotation.id,
      summary: `Created quotation ${quotation.number} for ${customer.name}`,
      metadata: { total: totals.total },
    });

    revalidatePath('/quotations');
    return actionOk({ id: quotation.id, number: quotation.number });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/**
 * Editing is restricted to drafts.
 *
 * Once a quotation has been sent it is a figure the customer is holding you
 * to, so rewriting its lines in place would change what they agreed to without
 * any record of it. Duplicating produces a fresh number instead.
 */
export async function updateQuotationAction(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { organization, user } = await requirePermission('quotations.edit');

    const parsed = quotationSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the quotation details.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;

    const existing = await db.quotation.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: { id: true, number: true, status: true },
    });
    if (!existing) return actionError('That quotation no longer exists.');
    if (existing.status !== 'DRAFT') {
      return actionError(
        'Only draft quotations can be edited. Duplicate this one to make changes.',
      );
    }

    const { totals, rows } = lineRows(data);

    await db.$transaction(async (tx) => {
      await tx.quotationItem.deleteMany({ where: { quotationId: existing.id } });
      await tx.quotation.update({
        where: { id: existing.id },
        data: {
          customerId: data.customerId,
          issueDate: new Date(data.issueDate),
          expiryDate: new Date(data.expiryDate),
          subtotal: totals.subtotal,
          discountType: data.discountType,
          discountValue: data.discountValue,
          discountAmount: totals.discountAmount,
          taxAmount: totals.taxAmount,
          total: totals.total,
          notes: data.notes || null,
          terms: data.terms || null,
          items: { create: rows },
        },
      });
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'quotation',
      entityId: existing.id,
      summary: `Updated quotation ${existing.number}`,
    });

    revalidatePath('/quotations');
    revalidatePath(`/quotations/${existing.id}`);
    return actionOk({ id: existing.id });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/** Moves a draft to sent, which starts the expiry clock. */
export async function sendQuotationAction(id: string): Promise<ActionResult> {
  return transition(id, 'quotations.edit', (status) => {
    if (status !== 'DRAFT') return 'Only a draft quotation can be sent.';
    return { status: 'SENT', sentAt: new Date() };
  }, 'Sent quotation');
}

/** The customer said yes. Accepting is what makes conversion available. */
export async function acceptQuotationAction(id: string): Promise<ActionResult> {
  return transition(id, 'quotations.edit', (status) => {
    if (status === 'CONVERTED') return 'That quotation has already become an invoice.';
    if (status === 'ACCEPTED') return 'That quotation is already marked accepted.';
    if (status === 'DRAFT') return 'Send the quotation before marking it accepted.';
    return { status: 'ACCEPTED', acceptedAt: new Date(), rejectedAt: null };
  }, 'Marked quotation accepted');
}

/** The customer said no. Reversible, because people change their minds. */
export async function rejectQuotationAction(id: string): Promise<ActionResult> {
  return transition(id, 'quotations.edit', (status) => {
    if (status === 'CONVERTED') return 'That quotation has already become an invoice.';
    if (status === 'DRAFT') return 'A draft quotation has not been sent yet.';
    return { status: 'REJECTED', rejectedAt: new Date(), acceptedAt: null };
  }, 'Marked quotation declined');
}

/** Puts a declined or lapsed quotation back in front of the customer. */
export async function reopenQuotationAction(id: string): Promise<ActionResult> {
  return transition(id, 'quotations.edit', (status) => {
    if (status === 'CONVERTED') return 'That quotation has already become an invoice.';
    if (!['REJECTED', 'EXPIRED'].includes(status)) {
      return 'Only a declined or expired quotation can be reopened.';
    }
    return { status: 'SENT', rejectedAt: null };
  }, 'Reopened quotation');
}

/** Shared guard-and-write for the simple status moves above. */
async function transition(
  id: string,
  permission: 'quotations.edit',
  decide: (
    status: QuotationStatus,
  ) => string | { status: QuotationStatus; [key: string]: unknown },
  summaryPrefix: string,
): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission(permission);

    const existing = await db.quotation.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: { id: true, number: true, status: true },
    });
    if (!existing) return actionError('That quotation no longer exists.');

    const outcome = decide(existing.status);
    if (typeof outcome === 'string') return actionError(outcome);

    await db.quotation.update({ where: { id: existing.id }, data: outcome });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'quotation',
      entityId: existing.id,
      summary: `${summaryPrefix} ${existing.number}`,
    });

    revalidatePath('/quotations');
    revalidatePath(`/quotations/${existing.id}`);
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/**
 * Turns an accepted quotation into a draft invoice.
 *
 * The lines are copied with their already-computed amounts, so the invoice
 * cannot disagree with the figure the customer accepted. It arrives as a
 * draft: the ordinary send step then handles stock and the customer-facing
 * document, rather than this shortcut having its own copy of that logic.
 *
 * The one-to-one link on `Invoice.quotationId` is what makes converting twice
 * impossible — the second attempt violates a unique constraint rather than
 * quietly producing a duplicate invoice.
 */
export async function convertQuotationAction(
  id: string,
): Promise<ActionResult<{ invoiceId: string; invoiceNumber: string }>> {
  try {
    // Converting writes an invoice, so it needs that permission too.
    const { organization, user } = await requirePermission([
      'quotations.edit',
      'invoices.create',
    ]);

    const quotation = await db.quotation.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      include: {
        items: { orderBy: { sortOrder: 'asc' } },
        customer: { select: { id: true, name: true, status: true, paymentTermDays: true } },
        invoice: { select: { id: true, number: true } },
      },
    });

    if (!quotation) return actionError('That quotation no longer exists.');
    if (quotation.invoice) {
      return actionError(
        `That quotation is already invoice ${quotation.invoice.number}.`,
      );
    }
    if (quotation.status !== 'ACCEPTED') {
      return actionError('Mark the quotation accepted before converting it.');
    }
    if (quotation.customer.status === 'BLOCKED') {
      return actionError('That customer is blocked and cannot be invoiced.');
    }
    if (quotation.items.length === 0) {
      return actionError('That quotation has no lines to invoice.');
    }

    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + (quotation.customer.paymentTermDays ?? 14));

    const invoice = await db.$transaction(async (tx) => {
      const number = await nextDocumentNumber(tx, organization.id, 'invoice', {
        date: issueDate,
      });

      return tx.invoice.create({
        data: {
          organizationId: organization.id,
          customerId: quotation.customerId,
          quotationId: quotation.id,
          number,
          status: 'DRAFT',
          issueDate,
          dueDate,
          currency: quotation.currency,
          subtotal: quotation.subtotal,
          discountType: quotation.discountType,
          discountValue: quotation.discountValue,
          discountAmount: quotation.discountAmount,
          taxAmount: quotation.taxAmount,
          shippingAmount: 0,
          total: quotation.total,
          amountPaid: 0,
          balanceDue: quotation.total,
          notes: quotation.notes,
          terms: quotation.terms,
          reference: quotation.number,
          createdById: user.id,
          items: {
            create: quotation.items.map((item, index) => ({
              productId: item.productId,
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              discountRate: item.discountRate,
              taxRate: item.taxRate,
              lineSubtotal: item.lineSubtotal,
              lineDiscount: item.lineDiscount,
              lineTax: item.lineTax,
              lineTotal: item.lineTotal,
              sortOrder: index,
            })),
          },
        },
        select: { id: true, number: true },
      });
    });

    await db.quotation.update({
      where: { id: quotation.id },
      data: { status: 'CONVERTED', convertedAt: new Date() },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'convert',
      entityType: 'quotation',
      entityId: quotation.id,
      summary: `Converted quotation ${quotation.number} to invoice ${invoice.number}`,
      metadata: { invoiceId: invoice.id, total: toNumber(quotation.total) },
    });

    revalidatePath('/quotations');
    revalidatePath(`/quotations/${quotation.id}`);
    revalidatePath('/invoices');
    return actionOk({ invoiceId: invoice.id, invoiceNumber: invoice.number });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/** Copies a quotation into a fresh draft with a new number. */
export async function duplicateQuotationAction(
  id: string,
): Promise<ActionResult<{ id: string; number: string }>> {
  try {
    const { organization, user } = await requirePermission('quotations.create');

    const source = await db.quotation.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!source) return actionError('That quotation no longer exists.');

    const issueDate = new Date();
    const expiryDate = new Date(issueDate);
    // Keep the original's validity window rather than inventing a new one.
    const validDays = Math.max(
      1,
      Math.round(
        (source.expiryDate.getTime() - source.issueDate.getTime()) / 86_400_000,
      ),
    );
    expiryDate.setDate(expiryDate.getDate() + validDays);

    const copy = await db.$transaction(async (tx) => {
      const number = await nextDocumentNumber(tx, organization.id, 'quotation', {
        date: issueDate,
      });

      return tx.quotation.create({
        data: {
          organizationId: organization.id,
          customerId: source.customerId,
          number,
          status: 'DRAFT',
          issueDate,
          expiryDate,
          currency: source.currency,
          subtotal: source.subtotal,
          discountType: source.discountType,
          discountValue: source.discountValue,
          discountAmount: source.discountAmount,
          taxAmount: source.taxAmount,
          total: source.total,
          notes: source.notes,
          terms: source.terms,
          createdById: user.id,
          items: {
            create: source.items.map((item, index) => ({
              productId: item.productId,
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              discountRate: item.discountRate,
              taxRate: item.taxRate,
              lineSubtotal: item.lineSubtotal,
              lineDiscount: item.lineDiscount,
              lineTax: item.lineTax,
              lineTotal: item.lineTotal,
              sortOrder: index,
            })),
          },
        },
        select: { id: true, number: true },
      });
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'create',
      entityType: 'quotation',
      entityId: copy.id,
      summary: `Duplicated quotation ${source.number} as ${copy.number}`,
    });

    revalidatePath('/quotations');
    return actionOk({ id: copy.id, number: copy.number });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/** Soft delete, refused once an invoice depends on it. */
export async function deleteQuotationAction(id: string): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('quotations.delete');

    const existing = await db.quotation.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: {
        id: true,
        number: true,
        invoice: { select: { number: true } },
      },
    });
    if (!existing) return actionError('That quotation no longer exists.');
    if (existing.invoice) {
      return actionError(
        `Invoice ${existing.invoice.number} came from this quotation, so it cannot be deleted.`,
      );
    }

    await db.quotation.update({
      where: { id: existing.id },
      data: { deletedAt: new Date() },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'delete',
      entityType: 'quotation',
      entityId: existing.id,
      summary: `Deleted quotation ${existing.number}`,
    });

    revalidatePath('/quotations');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}
