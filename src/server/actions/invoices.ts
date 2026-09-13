'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { invoiceSchema, type InvoiceInput } from '@/lib/validations/document';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { logActivity } from '@/server/activity';
import { nextDocumentNumber } from '@/server/numbering';
import { totalsFor } from '@/server/services/invoices';
import { actionError, actionOk, type ActionResult } from '@/server/actions/types';
import { round, toNumber } from '@/lib/money';
import type { Prisma } from '@/generated/prisma/client';
import type { InvoiceStatus } from '@/generated/prisma/enums';

/** Raised when committing an invoice would leave a tracked product negative. */
class InsufficientStockError extends Error {
  constructor(
    readonly productName: string,
    readonly available: number,
    readonly requested: number,
  ) {
    super(
      `Only ${available} of "${productName}" in stock, but this invoice needs ${requested}.`,
    );
    this.name = 'InsufficientStockError';
  }
}

/** Statuses that have left the draft stage and therefore affect stock. */
const COMMITTED: InvoiceStatus[] = [
  'SENT',
  'VIEWED',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
];

function lineRows(data: InvoiceInput) {
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

export async function createInvoiceAction(
  input: unknown,
  options?: { send?: boolean },
): Promise<ActionResult<{ id: string; number: string }>> {
  try {
    const { organization, user } = await requirePermission('invoices.create');

    const parsed = invoiceSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the invoice details.',
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
      return actionError('That customer is blocked and cannot be invoiced.', 'customerId');
    }

    const { totals, rows } = lineRows(data);
    const status: InvoiceStatus = options?.send ? 'SENT' : 'DRAFT';

    const invoice = await db.$transaction(async (tx) => {
      const number = await nextDocumentNumber(tx, organization.id, 'invoice', {
        date: new Date(data.issueDate),
      });

      const created = await tx.invoice.create({
        data: {
          organizationId: organization.id,
          customerId: customer.id,
          number,
          status,
          issueDate: new Date(data.issueDate),
          dueDate: new Date(data.dueDate),
          currency: organization.currency,
          subtotal: totals.subtotal,
          discountType: data.discountType,
          discountValue: data.discountValue,
          discountAmount: totals.discountAmount,
          taxAmount: totals.taxAmount,
          shippingAmount: totals.shippingAmount,
          total: totals.total,
          amountPaid: 0,
          balanceDue: totals.total,
          notes: data.notes || null,
          terms: data.terms || null,
          reference: data.reference || null,
          projectId: data.projectId || null,
          sentAt: options?.send ? new Date() : null,
          createdById: user.id,
          items: { create: rows },
        },
        select: { id: true, number: true },
      });

      if (COMMITTED.includes(status)) {
        await applyStockForInvoice(tx, organization.id, created.id, created.number, 'out');
      }

      return created;
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'create',
      entityType: 'invoice',
      entityId: invoice.id,
      summary: `Created invoice ${invoice.number} for ${customer.name}`,
      metadata: { total: totals.total },
    });

    revalidatePath('/invoices');
    revalidatePath('/dashboard');
    return actionOk({ id: invoice.id, number: invoice.number });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    if (error instanceof InsufficientStockError) return actionError(error.message);
    throw error;
  }
}

/**
 * Editing is restricted to drafts.
 *
 * Once an invoice has been sent it is a document the customer holds, so
 * changing its lines would silently rewrite history and desynchronise stock.
 */
export async function updateInvoiceAction(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { organization, user } = await requirePermission('invoices.edit');

    const parsed = invoiceSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the invoice details.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;

    const existing = await db.invoice.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: { id: true, number: true, status: true },
    });
    if (!existing) return actionError('That invoice no longer exists.');
    if (existing.status !== 'DRAFT') {
      return actionError(
        'Only draft invoices can be edited. Duplicate this one to make changes.',
      );
    }

    const { totals, rows } = lineRows(data);

    await db.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: existing.id } });
      await tx.invoice.update({
        where: { id: existing.id },
        data: {
          customerId: data.customerId,
          issueDate: new Date(data.issueDate),
          dueDate: new Date(data.dueDate),
          subtotal: totals.subtotal,
          discountType: data.discountType,
          discountValue: data.discountValue,
          discountAmount: totals.discountAmount,
          taxAmount: totals.taxAmount,
          shippingAmount: totals.shippingAmount,
          total: totals.total,
          balanceDue: totals.total,
          notes: data.notes || null,
          terms: data.terms || null,
          reference: data.reference || null,
          projectId: data.projectId || null,
          items: { create: rows },
        },
      });
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'invoice',
      entityId: id,
      summary: `Updated draft invoice ${existing.number}`,
    });

    revalidatePath('/invoices');
    revalidatePath(`/invoices/${id}`);
    return actionOk({ id });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/** Moves a draft to sent, which is also the point stock leaves the building. */
export async function sendInvoiceAction(id: string): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('invoices.edit');

    const result = await db.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id, organizationId: organization.id, deletedAt: null },
        select: { id: true, number: true, status: true, dueDate: true, total: true },
      });
      if (!invoice) return { ok: false as const, error: 'That invoice no longer exists.' };
      if (invoice.status !== 'DRAFT') {
        return { ok: false as const, error: 'This invoice has already been sent.' };
      }

      await tx.invoice.update({
        where: { id: invoice.id },
        data: {
          status: invoice.dueDate < new Date() ? 'OVERDUE' : 'SENT',
          sentAt: new Date(),
        },
      });

      await applyStockForInvoice(tx, organization.id, invoice.id, invoice.number, 'out');
      return { ok: true as const, invoice };
    });

    if (!result.ok) return actionError(result.error);

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'send',
      entityType: 'invoice',
      entityId: id,
      summary: `Sent invoice ${result.invoice.number}`,
    });

    revalidatePath('/invoices');
    revalidatePath(`/invoices/${id}`);
    revalidatePath('/dashboard');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    if (error instanceof InsufficientStockError) return actionError(error.message);
    throw error;
  }
}

/** Cancelling returns any stock the invoice took out. */
export async function cancelInvoiceAction(id: string): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('invoices.edit');

    const result = await db.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({
        where: { id, organizationId: organization.id, deletedAt: null },
        select: { id: true, number: true, status: true, amountPaid: true },
      });
      if (!invoice) return { ok: false as const, error: 'That invoice no longer exists.' };
      if (invoice.status === 'CANCELLED') {
        return { ok: false as const, error: 'This invoice is already cancelled.' };
      }
      if (toNumber(invoice.amountPaid) > 0) {
        return {
          ok: false as const,
          error:
            'Payments have been recorded against this invoice. Refund or remove them before cancelling.',
        };
      }

      if (COMMITTED.includes(invoice.status)) {
        await applyStockForInvoice(tx, organization.id, invoice.id, invoice.number, 'in');
      }

      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: 'CANCELLED', cancelledAt: new Date(), balanceDue: 0 },
      });

      return { ok: true as const, invoice };
    });

    if (!result.ok) return actionError(result.error);

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'cancel',
      entityType: 'invoice',
      entityId: id,
      summary: `Cancelled invoice ${result.invoice.number}`,
    });

    revalidatePath('/invoices');
    revalidatePath(`/invoices/${id}`);
    revalidatePath('/dashboard');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function duplicateInvoiceAction(
  id: string,
): Promise<ActionResult<{ id: string; number: string }>> {
  try {
    const { organization, user } = await requirePermission('invoices.create');

    const source = await db.invoice.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      include: { items: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!source) return actionError('That invoice no longer exists.');

    const issueDate = new Date();
    const termDays = Math.max(
      0,
      Math.round(
        (source.dueDate.getTime() - source.issueDate.getTime()) / 86_400_000,
      ),
    );

    const copy = await db.$transaction(async (tx) => {
      const number = await nextDocumentNumber(tx, organization.id, 'invoice', {
        date: issueDate,
      });

      return tx.invoice.create({
        data: {
          organizationId: organization.id,
          customerId: source.customerId,
          number,
          status: 'DRAFT',
          issueDate,
          dueDate: new Date(issueDate.getTime() + termDays * 86_400_000),
          currency: source.currency,
          subtotal: source.subtotal,
          discountType: source.discountType,
          discountValue: source.discountValue,
          discountAmount: source.discountAmount,
          taxAmount: source.taxAmount,
          shippingAmount: source.shippingAmount,
          total: source.total,
          amountPaid: 0,
          balanceDue: source.total,
          notes: source.notes,
          terms: source.terms,
          createdById: user.id,
          items: {
            create: source.items.map((item) => ({
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
              sortOrder: item.sortOrder,
            })),
          },
        },
        select: { id: true, number: true },
      });
    });

    revalidatePath('/invoices');
    return actionOk({ id: copy.id, number: copy.number });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function deleteInvoiceAction(id: string): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('invoices.delete');

    const invoice = await db.invoice.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: { id: true, number: true, status: true },
    });
    if (!invoice) return actionError('That invoice no longer exists.');
    if (invoice.status !== 'DRAFT') {
      return actionError(
        'Only drafts can be deleted. Cancel the invoice instead so the record is kept.',
      );
    }

    await db.invoice.update({
      where: { id: invoice.id },
      data: { deletedAt: new Date() },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'delete',
      entityType: 'invoice',
      entityId: id,
      summary: `Deleted draft invoice ${invoice.number}`,
    });

    revalidatePath('/invoices');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/** Records that the customer opened the invoice. Never downgrades a status. */
export async function markInvoiceViewedAction(id: string): Promise<ActionResult> {
  try {
    const { organization } = await requirePermission('invoices.edit');

    await db.invoice.updateMany({
      where: { id, organizationId: organization.id, status: 'SENT' },
      data: { status: 'VIEWED', viewedAt: new Date() },
    });

    revalidatePath(`/invoices/${id}`);
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/**
 * Moves stock for every tracked line on an invoice and records the movement.
 * `direction` is 'out' when the invoice commits and 'in' when it is cancelled.
 */
async function applyStockForInvoice(
  tx: Prisma.TransactionClient,
  organizationId: string,
  invoiceId: string,
  invoiceNumber: string,
  direction: 'in' | 'out',
) {
  const items = await tx.invoiceItem.findMany({
    where: { invoiceId, productId: { not: null } },
    select: { productId: true, quantity: true, name: true },
  });

  for (const item of items) {
    if (!item.productId) continue;

    const product = await tx.product.findFirst({
      where: { id: item.productId, organizationId, trackInventory: true },
      select: { id: true, stockQuantity: true },
    });
    if (!product) continue;

    const quantity = toNumber(item.quantity);
    const delta = direction === 'out' ? -quantity : quantity;
    const balanceAfter = round(toNumber(product.stockQuantity) + delta, 3);

    // Committing must not drive stock negative — the same invariant the
    // manual adjustment enforces. Throwing rolls the whole transaction back.
    if (balanceAfter < 0) {
      throw new InsufficientStockError(
        item.name,
        toNumber(product.stockQuantity),
        quantity,
      );
    }

    await tx.product.update({
      where: { id: product.id },
      data: { stockQuantity: balanceAfter },
    });

    await tx.inventoryTransaction.create({
      data: {
        organizationId,
        productId: product.id,
        type: direction === 'out' ? 'SALE' : 'RETURN_IN',
        quantity: delta,
        balanceAfter,
        reference: invoiceNumber,
        referenceType: 'invoice',
        referenceId: invoiceId,
        reason:
          direction === 'out'
            ? `Sold on ${invoiceNumber}`
            : `Returned from cancelled ${invoiceNumber}`,
      },
    });
  }
}
