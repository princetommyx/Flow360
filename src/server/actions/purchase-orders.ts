'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { toNumber } from '@/lib/money';
import {
  purchaseOrderSchema,
  receiveGoodsSchema,
  type PurchaseOrderInput,
} from '@/lib/validations/purchasing';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { logActivity } from '@/server/activity';
import { nextDocumentNumber } from '@/server/numbering';
import { EDITABLE_STATUSES, totalsFor } from '@/server/services/purchase-orders';
import { actionError, actionOk, type ActionResult } from '@/server/actions/types';
import type { PurchaseOrderStatus } from '@/generated/prisma/enums';

function lineRows(data: PurchaseOrderInput) {
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

export async function createPurchaseOrderAction(
  input: unknown,
  options?: { send?: boolean },
): Promise<ActionResult<{ id: string; number: string }>> {
  try {
    const { organization, user } = await requirePermission('purchases.create');

    const parsed = purchaseOrderSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the order details.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;

    const supplier = await db.supplier.findFirst({
      where: { id: data.supplierId, organizationId: organization.id, deletedAt: null },
      select: { id: true, name: true, companyName: true, status: true },
    });
    if (!supplier) return actionError('That supplier no longer exists.', 'supplierId');
    if (supplier.status === 'BLOCKED') {
      return actionError('That supplier is blocked and cannot be ordered from.', 'supplierId');
    }

    const { totals, rows } = lineRows(data);
    const status: PurchaseOrderStatus = options?.send ? 'SENT' : 'DRAFT';

    const order = await db.$transaction(async (tx) => {
      const number = await nextDocumentNumber(tx, organization.id, 'purchase_order', {
        date: new Date(data.orderDate),
      });

      return tx.purchaseOrder.create({
        data: {
          organizationId: organization.id,
          supplierId: supplier.id,
          number,
          status,
          orderDate: new Date(data.orderDate),
          expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
          currency: organization.currency,
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          discountAmount: totals.discountAmount,
          total: totals.total,
          notes: data.notes || null,
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
      entityType: 'purchase_order',
      entityId: order.id,
      summary: `Created purchase order ${order.number} for ${supplier.companyName ?? supplier.name}`,
      metadata: { total: totals.total },
    });

    revalidatePath('/purchase-orders');
    return actionOk({ id: order.id, number: order.number });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/**
 * Editing stops once goods start arriving.
 *
 * A confirmed order is what the supplier is picking against, and once anything
 * has been received the lines are tied to stock movements that already
 * happened. Rewriting them would leave the ledger describing an order that no
 * longer exists.
 */
export async function updatePurchaseOrderAction(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { organization, user } = await requirePermission('purchases.edit');

    const parsed = purchaseOrderSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the order details.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;

    const existing = await db.purchaseOrder.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: { id: true, number: true, status: true },
    });
    if (!existing) return actionError('That purchase order no longer exists.');
    if (!EDITABLE_STATUSES.includes(existing.status)) {
      return actionError(
        `A ${existing.status.toLowerCase().replace(/_/g, ' ')} order cannot be edited. Cancel it and raise a new one.`,
      );
    }

    const supplier = await db.supplier.findFirst({
      where: { id: data.supplierId, organizationId: organization.id, deletedAt: null },
      select: { id: true },
    });
    if (!supplier) return actionError('That supplier no longer exists.', 'supplierId');

    const { totals, rows } = lineRows(data);

    await db.$transaction(async (tx) => {
      // Replacing the lines wholesale keeps sortOrder honest and avoids
      // diffing rows the reader may have reordered, split or removed.
      await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });

      await tx.purchaseOrder.update({
        where: { id },
        data: {
          supplierId: supplier.id,
          orderDate: new Date(data.orderDate),
          expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
          subtotal: totals.subtotal,
          taxAmount: totals.taxAmount,
          discountAmount: totals.discountAmount,
          total: totals.total,
          notes: data.notes || null,
          items: { create: rows },
        },
      });
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'purchase_order',
      entityId: id,
      summary: `Updated purchase order ${existing.number}`,
      metadata: { total: totals.total },
    });

    revalidatePath('/purchase-orders');
    revalidatePath(`/purchase-orders/${id}`);
    return actionOk({ id });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

const ALLOWED_TRANSITIONS: Record<string, PurchaseOrderStatus[]> = {
  DRAFT: ['SENT', 'CANCELLED'],
  SENT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['CANCELLED'],
  PARTIALLY_RECEIVED: ['CANCELLED'],
  RECEIVED: [],
  BILLED: [],
  CANCELLED: [],
};

export async function setPurchaseOrderStatusAction(
  id: string,
  status: PurchaseOrderStatus,
): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('purchases.edit');

    const order = await db.purchaseOrder.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: { id: true, number: true, status: true },
    });
    if (!order) return actionError('That purchase order no longer exists.');

    if (!ALLOWED_TRANSITIONS[order.status]?.includes(status)) {
      return actionError(
        `A ${order.status.toLowerCase().replace(/_/g, ' ')} order cannot move to ${status.toLowerCase().replace(/_/g, ' ')}.`,
      );
    }

    await db.purchaseOrder.update({ where: { id }, data: { status } });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'purchase_order',
      entityId: id,
      summary: `Marked purchase order ${order.number} as ${status.toLowerCase().replace(/_/g, ' ')}`,
    });

    revalidatePath('/purchase-orders');
    revalidatePath(`/purchase-orders/${id}`);
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/**
 * Books a delivery against the order.
 *
 * Received quantities are absolute, not deltas, so re-submitting the same
 * figures is a no-op rather than double-counting stock. Only the difference
 * reaches the inventory ledger, and only for products that are actually
 * tracked — a service line on a purchase order has nothing to move.
 */
export async function receiveGoodsAction(input: unknown): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('purchases.edit');

    const parsed = receiveGoodsSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(parsed.error.issues[0]?.message ?? 'Check the quantities.');
    }
    const data = parsed.data;

    const order = await db.purchaseOrder.findFirst({
      where: {
        id: data.purchaseOrderId,
        organizationId: organization.id,
        deletedAt: null,
      },
      select: {
        id: true,
        number: true,
        status: true,
        items: {
          select: {
            id: true,
            name: true,
            productId: true,
            quantity: true,
            receivedQuantity: true,
            unitPrice: true,
          },
        },
      },
    });
    if (!order) return actionError('That purchase order no longer exists.');
    if (order.status === 'CANCELLED') {
      return actionError('A cancelled order cannot receive goods.');
    }
    if (order.status === 'DRAFT') {
      return actionError('Send the order to the supplier before receiving against it.');
    }

    const byId = new Map(order.items.map((item) => [item.id, item]));

    for (const line of data.lines) {
      const item = byId.get(line.itemId);
      if (!item) return actionError('One of those lines is no longer on the order.');
      if (line.receivedQuantity > toNumber(item.quantity)) {
        return actionError(
          `You cannot receive more ${item.name} than was ordered (${toNumber(item.quantity)}).`,
        );
      }
    }

    const occurredAt = new Date(data.receivedAt);

    await db.$transaction(async (tx) => {
      for (const line of data.lines) {
        const item = byId.get(line.itemId)!;
        const previous = toNumber(item.receivedQuantity);
        const delta = line.receivedQuantity - previous;

        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: { receivedQuantity: line.receivedQuantity },
        });

        if (delta === 0 || !item.productId) continue;

        const product = await tx.product.findFirst({
          where: { id: item.productId, organizationId: organization.id },
          select: { id: true, stockQuantity: true, trackInventory: true },
        });
        if (!product?.trackInventory) continue;

        const balanceAfter = toNumber(product.stockQuantity) + delta;

        await tx.product.update({
          where: { id: product.id },
          data: { stockQuantity: balanceAfter },
        });

        await tx.inventoryTransaction.create({
          data: {
            organizationId: organization.id,
            productId: product.id,
            // A correction downwards is still a purchase movement — it belongs
            // to this delivery, and calling it an adjustment would hide that.
            type: 'PURCHASE',
            quantity: delta,
            balanceAfter,
            unitCost: item.unitPrice,
            reference: order.number,
            referenceType: 'purchase_order',
            referenceId: order.id,
            reason: delta > 0 ? 'Goods received' : 'Goods receipt corrected',
            occurredAt,
            createdById: user.id,
          },
        });
      }

      const items = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: order.id },
        select: { quantity: true, receivedQuantity: true },
      });

      const fully = items.every(
        (item) => toNumber(item.receivedQuantity) >= toNumber(item.quantity),
      );
      const any = items.some((item) => toNumber(item.receivedQuantity) > 0);

      await tx.purchaseOrder.update({
        where: { id: order.id },
        data: {
          status: fully ? 'RECEIVED' : any ? 'PARTIALLY_RECEIVED' : 'CONFIRMED',
          receivedAt: fully ? occurredAt : null,
        },
      });
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'purchase_order',
      entityId: order.id,
      summary: `Recorded a delivery against ${order.number}`,
    });

    revalidatePath('/purchase-orders');
    revalidatePath(`/purchase-orders/${order.id}`);
    revalidatePath('/inventory');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function deletePurchaseOrderAction(id: string): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('purchases.delete');

    const order = await db.purchaseOrder.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: {
        id: true,
        number: true,
        status: true,
        _count: { select: { bills: true } },
      },
    });
    if (!order) return actionError('That purchase order no longer exists.');

    if (order._count.bills > 0) {
      return actionError('This order has been billed, so it cannot be deleted.');
    }
    if (!EDITABLE_STATUSES.includes(order.status) && order.status !== 'CANCELLED') {
      return actionError(
        'Goods have been received against this order. Cancel it instead of deleting it.',
      );
    }

    await db.purchaseOrder.update({ where: { id }, data: { deletedAt: new Date() } });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'delete',
      entityType: 'purchase_order',
      entityId: id,
      summary: `Deleted purchase order ${order.number}`,
    });

    revalidatePath('/purchase-orders');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}
