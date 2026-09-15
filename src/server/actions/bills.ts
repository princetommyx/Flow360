'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { round, toNumber } from '@/lib/money';
import {
  billSchema,
  recordBillPaymentSchema,
  type BillInput,
} from '@/lib/validations/purchasing';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { logActivity } from '@/server/activity';
import { nextDocumentNumber } from '@/server/numbering';
import { deriveBillStatus, EDITABLE_STATUSES, totalsFor } from '@/server/services/bills';
import { actionError, actionOk, type ActionResult } from '@/server/actions/types';
import type { BillStatus } from '@/generated/prisma/enums';

function lineRows(data: BillInput) {
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
      taxRate: item.taxRate,
      lineSubtotal: totals.lines[index].lineSubtotal,
      lineTax: totals.lines[index].lineTax,
      lineTotal: totals.lines[index].lineTotal,
      sortOrder: index,
    })),
  };
}

export async function createBillAction(
  input: unknown,
  options?: { approve?: boolean },
): Promise<ActionResult<{ id: string; number: string }>> {
  try {
    const { organization, user } = await requirePermission('bills.create');

    const parsed = billSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the bill details.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;

    const supplier = await db.supplier.findFirst({
      where: { id: data.supplierId, organizationId: organization.id, deletedAt: null },
      select: { id: true, name: true, companyName: true },
    });
    if (!supplier) return actionError('That supplier no longer exists.', 'supplierId');

    // A purchase order can only be billed once, and only its own supplier's.
    let purchaseOrderId: string | null = null;
    if (data.purchaseOrderId) {
      const order = await db.purchaseOrder.findFirst({
        where: {
          id: data.purchaseOrderId,
          organizationId: organization.id,
          deletedAt: null,
        },
        select: {
          id: true,
          supplierId: true,
          _count: { select: { bills: { where: { deletedAt: null } } } },
        },
      });
      if (!order) return actionError('That purchase order no longer exists.');
      if (order.supplierId !== supplier.id) {
        return actionError('That order belongs to a different supplier.', 'supplierId');
      }
      if (order._count.bills > 0) {
        return actionError('That order has already been billed.');
      }
      purchaseOrderId = order.id;
    }

    const { totals, rows } = lineRows(data);
    const dueDate = new Date(data.dueDate);
    const status: BillStatus = options?.approve
      ? deriveBillStatus('AWAITING_PAYMENT', totals.total, 0, dueDate)
      : 'DRAFT';

    const bill = await db.$transaction(async (tx) => {
      const number = await nextDocumentNumber(tx, organization.id, 'bill', {
        date: new Date(data.issueDate),
      });

      const created = await tx.bill.create({
        data: {
          organizationId: organization.id,
          supplierId: supplier.id,
          purchaseOrderId,
          number,
          supplierRef: data.supplierRef || null,
          status,
          issueDate: new Date(data.issueDate),
          dueDate,
          currency: organization.currency,
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          total: totals.total,
          amountPaid: 0,
          balanceDue: totals.total,
          notes: data.notes || null,
          createdById: user.id,
          items: { create: rows },
        },
        select: { id: true, number: true },
      });

      if (purchaseOrderId) {
        await tx.purchaseOrder.update({
          where: { id: purchaseOrderId },
          data: { status: 'BILLED' },
        });
      }

      return created;
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'create',
      entityType: 'bill',
      entityId: bill.id,
      summary: `Recorded bill ${bill.number} from ${supplier.companyName ?? supplier.name}`,
      metadata: { total: totals.total },
    });

    revalidatePath('/bills');
    revalidatePath('/purchase-orders');
    return actionOk({ id: bill.id, number: bill.number });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function updateBillAction(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { organization, user } = await requirePermission('bills.edit');

    const parsed = billSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the bill details.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;

    const existing = await db.bill.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: { id: true, number: true, status: true },
    });
    if (!existing) return actionError('That bill no longer exists.');
    if (!EDITABLE_STATUSES.includes(existing.status)) {
      return actionError(
        'Only draft bills can be edited. This one is already in your payables.',
      );
    }

    const supplier = await db.supplier.findFirst({
      where: { id: data.supplierId, organizationId: organization.id, deletedAt: null },
      select: { id: true },
    });
    if (!supplier) return actionError('That supplier no longer exists.', 'supplierId');

    const { totals, rows } = lineRows(data);

    await db.$transaction(async (tx) => {
      await tx.billItem.deleteMany({ where: { billId: id } });

      await tx.bill.update({
        where: { id },
        data: {
          supplierId: supplier.id,
          supplierRef: data.supplierRef || null,
          issueDate: new Date(data.issueDate),
          dueDate: new Date(data.dueDate),
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          total: totals.total,
          balanceDue: totals.total,
          notes: data.notes || null,
          items: { create: rows },
        },
      });
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'bill',
      entityId: id,
      summary: `Updated bill ${existing.number}`,
      metadata: { total: totals.total },
    });

    revalidatePath('/bills');
    revalidatePath(`/bills/${id}`);
    return actionOk({ id });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/** Moves a draft into payables, where it starts counting towards what you owe. */
export async function approveBillAction(id: string): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('bills.edit');

    const bill = await db.bill.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: { id: true, number: true, status: true, total: true, dueDate: true },
    });
    if (!bill) return actionError('That bill no longer exists.');
    if (bill.status !== 'DRAFT') return actionError('This bill is already approved.');

    await db.bill.update({
      where: { id },
      data: {
        status: deriveBillStatus(
          'AWAITING_PAYMENT',
          toNumber(bill.total),
          0,
          bill.dueDate,
        ),
      },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'bill',
      entityId: id,
      summary: `Approved bill ${bill.number} for payment`,
    });

    revalidatePath('/bills');
    revalidatePath(`/bills/${id}`);
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function cancelBillAction(id: string): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('bills.edit');

    const bill = await db.bill.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: { id: true, number: true, status: true, amountPaid: true },
    });
    if (!bill) return actionError('That bill no longer exists.');
    if (toNumber(bill.amountPaid) > 0) {
      return actionError(
        'This bill has been paid against, so it cannot be cancelled. Reverse the payment first.',
      );
    }
    if (bill.status === 'CANCELLED') return actionError('This bill is already cancelled.');

    await db.bill.update({
      where: { id },
      data: { status: 'CANCELLED', balanceDue: 0 },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'bill',
      entityId: id,
      summary: `Cancelled bill ${bill.number}`,
    });

    revalidatePath('/bills');
    revalidatePath(`/bills/${id}`);
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/**
 * Pays a supplier.
 *
 * The mirror image of recording a customer payment: one outgoing payment, one
 * expense transaction on the account it left, and the account balance goes
 * down. Written in a single transaction so the bill, the ledger and the
 * balance can never disagree.
 */
export async function recordBillPaymentAction(
  input: unknown,
): Promise<ActionResult<{ id: string; number: string }>> {
  try {
    const { organization, user } = await requirePermission('payments.create');

    const parsed = recordBillPaymentSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the payment details.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;

    const result = await db.$transaction(async (tx) => {
      const bill = await tx.bill.findFirst({
        where: { id: data.billId, organizationId: organization.id, deletedAt: null },
        select: {
          id: true,
          number: true,
          status: true,
          total: true,
          amountPaid: true,
          dueDate: true,
          supplierId: true,
          supplier: { select: { name: true, companyName: true } },
        },
      });
      if (!bill) return { ok: false as const, error: 'That bill no longer exists.' };
      if (bill.status === 'DRAFT') {
        return {
          ok: false as const,
          error: 'Approve the bill before paying against it.',
        };
      }
      if (bill.status === 'CANCELLED') {
        return { ok: false as const, error: 'This bill is cancelled, so it cannot be paid.' };
      }

      const total = toNumber(bill.total);
      const alreadyPaid = toNumber(bill.amountPaid);
      const outstanding = round(total - alreadyPaid);

      if (outstanding <= 0) {
        return { ok: false as const, error: 'This bill is already settled.' };
      }
      if (data.amount > outstanding) {
        return {
          ok: false as const,
          error: `That is more than the ${outstanding.toFixed(2)} outstanding on this bill.`,
        };
      }

      const account = await tx.account.findFirst({
        where: { id: data.accountId, organizationId: organization.id, deletedAt: null },
        select: { id: true, name: true },
      });
      if (!account) return { ok: false as const, error: 'That account no longer exists.' };

      const paidAt = new Date(data.paidAt);
      const number = await nextDocumentNumber(tx, organization.id, 'payment', {
        date: paidAt,
      });

      const payment = await tx.payment.create({
        data: {
          organizationId: organization.id,
          number,
          direction: 'OUTGOING',
          method: data.method,
          amount: data.amount,
          currency: organization.currency,
          paidAt,
          reference: data.reference || null,
          notes: data.notes || null,
          supplierId: bill.supplierId,
          billId: bill.id,
          accountId: account.id,
          createdById: user.id,
        },
        select: { id: true, number: true },
      });

      const amountPaid = round(alreadyPaid + data.amount);
      const balanceDue = round(total - amountPaid);

      await tx.bill.update({
        where: { id: bill.id },
        data: {
          amountPaid,
          balanceDue,
          status: deriveBillStatus(bill.status, total, amountPaid, bill.dueDate),
        },
      });

      await tx.transaction.create({
        data: {
          organizationId: organization.id,
          accountId: account.id,
          type: 'EXPENSE',
          // Signed relative to the account it left, the same convention the
          // rest of the ledger uses: money out is negative.
          amount: -data.amount,
          currency: organization.currency,
          description: `Paid supplier ${bill.number}`,
          category: 'Purchases',
          occurredAt: paidAt,
          reference: payment.number,
          billId: bill.id,
          paymentId: payment.id,
          createdById: user.id,
        },
      });

      await tx.account.update({
        where: { id: account.id },
        data: { currentBalance: { decrement: data.amount } },
      });

      return { ok: true as const, payment, bill };
    });

    if (!result.ok) return actionError(result.error);

    const supplierName =
      result.bill.supplier.companyName ?? result.bill.supplier.name;

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'payment',
      entityType: 'bill',
      entityId: result.bill.id,
      summary: `Paid ${data.amount} against ${result.bill.number} to ${supplierName}`,
    });

    revalidatePath('/bills');
    revalidatePath(`/bills/${result.bill.id}`);
    revalidatePath('/payments');
    revalidatePath('/accounts');
    revalidatePath('/transactions');
    return actionOk({ id: result.payment.id, number: result.payment.number });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function deleteBillAction(id: string): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('bills.delete');

    const bill = await db.bill.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: { id: true, number: true, status: true, amountPaid: true },
    });
    if (!bill) return actionError('That bill no longer exists.');
    if (toNumber(bill.amountPaid) > 0) {
      return actionError(
        'Money has been paid against this bill, so deleting it would lose that record. Cancel it instead.',
      );
    }

    await db.bill.update({ where: { id }, data: { deletedAt: new Date() } });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'delete',
      entityType: 'bill',
      entityId: id,
      summary: `Deleted bill ${bill.number}`,
    });

    revalidatePath('/bills');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}
