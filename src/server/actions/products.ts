'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import {
  productCategorySchema,
  productSchema,
  stockAdjustmentSchema,
} from '@/lib/validations/product';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { logActivity, notify } from '@/server/activity';
import { actionError, actionOk, type ActionResult } from '@/server/actions/types';
import { nullifyBlanks } from '@/server/actions/utils';
import { round, toNumber } from '@/lib/money';

const OPTIONAL_FIELDS = ['barcode', 'description'] as const;

export async function createProductAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { organization, user } = await requirePermission('products.create');

    const parsed = productSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the details entered.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }

    const data = parsed.data;
    const isService = data.type === 'SERVICE';
    const trackInventory = isService ? false : data.trackInventory;
    const openingStock = trackInventory ? data.stockQuantity : 0;

    if (await skuTaken(organization.id, data.sku)) {
      return actionError('That SKU is already in use.', 'sku');
    }

    // Creating a tracked product with opening stock must also write the
    // movement that explains it, or the stock history starts with a gap.
    const product = await db.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          ...nullifyBlanks(data, OPTIONAL_FIELDS),
          organizationId: organization.id,
          trackInventory,
          stockQuantity: openingStock,
          minStockLevel: trackInventory ? data.minStockLevel : 0,
          categoryId: data.categoryId || null,
          supplierId: data.supplierId || null,
        },
        select: { id: true, name: true },
      });

      if (openingStock > 0) {
        await tx.inventoryTransaction.create({
          data: {
            organizationId: organization.id,
            productId: created.id,
            type: 'STOCK_IN',
            quantity: openingStock,
            balanceAfter: openingStock,
            unitCost: data.purchasePrice,
            reason: 'Opening stock balance',
            createdById: user.id,
          },
        });
      }

      return created;
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'create',
      entityType: 'product',
      entityId: product.id,
      summary: `Added ${isService ? 'service' : 'product'} ${product.name}`,
    });

    revalidatePath('/products');
    return actionOk({ id: product.id });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function updateProductAction(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { organization, user } = await requirePermission('products.edit');

    const parsed = productSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the details entered.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }

    const data = parsed.data;
    const existing = await db.product.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: { id: true, sku: true },
    });
    if (!existing) return actionError('That product no longer exists.');

    if (
      data.sku !== existing.sku &&
      (await skuTaken(organization.id, data.sku, id))
    ) {
      return actionError('That SKU is already in use.', 'sku');
    }

    const isService = data.type === 'SERVICE';
    const trackInventory = isService ? false : data.trackInventory;

    // `stockQuantity` is intentionally not editable here — it is only ever
    // moved by a stock adjustment, so every change keeps an audit trail.
    const { stockQuantity: _ignored, ...rest } = data;

    await db.product.update({
      where: { id: existing.id },
      data: {
        ...nullifyBlanks(rest, OPTIONAL_FIELDS),
        trackInventory,
        minStockLevel: trackInventory ? data.minStockLevel : 0,
        categoryId: data.categoryId || null,
        supplierId: data.supplierId || null,
      },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'product',
      entityId: id,
      summary: `Updated ${data.name}`,
    });

    revalidatePath('/products');
    revalidatePath(`/products/${id}`);
    return actionOk({ id });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function deleteProductAction(id: string): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('products.delete');

    const product = await db.product.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: { id: true, name: true },
    });
    if (!product) return actionError('That product no longer exists.');

    await db.product.update({
      where: { id: product.id },
      data: { deletedAt: new Date(), status: 'INACTIVE' },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'delete',
      entityType: 'product',
      entityId: id,
      summary: `Removed ${product.name}`,
    });

    revalidatePath('/products');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/**
 * Records a stock movement and moves the balance in one transaction.
 *
 * STOCK_IN and STOCK_OUT take a delta; ADJUSTMENT takes the counted total and
 * the delta is derived, which is what a stocktake actually produces.
 */
export async function adjustStockAction(input: unknown): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('inventory.edit');

    const parsed = stockAdjustmentSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the details entered.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }

    const { productId, type, quantity, unitCost, reason, occurredAt } = parsed.data;

    const result = await db.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id: productId, organizationId: organization.id, deletedAt: null },
        select: { id: true, name: true, stockQuantity: true, trackInventory: true },
      });
      if (!product) {
        return { ok: false as const, error: 'That product no longer exists.' };
      }
      if (!product.trackInventory) {
        return { ok: false as const, error: 'This item does not track stock.' };
      }

      const current = toNumber(product.stockQuantity);
      const delta =
        type === 'STOCK_IN'
          ? quantity
          : type === 'STOCK_OUT'
            ? -quantity
            : round(quantity - current, 3);

      const balanceAfter = round(current + delta, 3);
      if (balanceAfter < 0) {
        return {
          ok: false as const,
          error: `Only ${current} in stock — that would leave a negative balance.`,
        };
      }
      if (delta === 0) {
        return { ok: false as const, error: 'That leaves the stock level unchanged.' };
      }

      await tx.product.update({
        where: { id: product.id },
        data: { stockQuantity: balanceAfter },
      });

      await tx.inventoryTransaction.create({
        data: {
          organizationId: organization.id,
          productId: product.id,
          type,
          quantity: delta,
          balanceAfter,
          unitCost: unitCost ?? null,
          reason,
          occurredAt: new Date(occurredAt),
          createdById: user.id,
        },
      });

      return { ok: true as const, product, balanceAfter, delta };
    });

    if (!result.ok) return actionError(result.error);

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'adjust',
      entityType: 'product',
      entityId: result.product.id,
      summary: `${result.delta > 0 ? 'Added' : 'Removed'} ${Math.abs(result.delta)} of ${result.product.name} (${reason})`,
    });

    revalidatePath('/products');
    revalidatePath(`/products/${productId}`);
    revalidatePath('/inventory');
    revalidatePath('/stock-adjustments');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function createCategoryAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { organization } = await requirePermission('products.create');

    const parsed = productCategorySchema.safeParse(input);
    if (!parsed.success) {
      return actionError(parsed.error.issues[0]?.message ?? 'Enter a category name.');
    }

    const existing = await db.productCategory.findFirst({
      where: {
        organizationId: organization.id,
        name: parsed.data.name,
        deletedAt: null,
      },
      select: { id: true },
    });
    if (existing) return actionError('A category with that name already exists.', 'name');

    const category = await db.productCategory.create({
      data: {
        organizationId: organization.id,
        name: parsed.data.name,
        description: parsed.data.description || null,
      },
      select: { id: true },
    });

    revalidatePath('/categories');
    revalidatePath('/products');
    return actionOk({ id: category.id });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function updateCategoryAction(
  id: string,
  input: unknown,
): Promise<ActionResult> {
  try {
    const { organization } = await requirePermission('products.edit');

    const parsed = productCategorySchema.safeParse(input);
    if (!parsed.success) {
      return actionError(parsed.error.issues[0]?.message ?? 'Enter a category name.');
    }

    const clash = await db.productCategory.findFirst({
      where: {
        organizationId: organization.id,
        name: parsed.data.name,
        deletedAt: null,
        NOT: { id },
      },
      select: { id: true },
    });
    if (clash) return actionError('A category with that name already exists.', 'name');

    const result = await db.productCategory.updateMany({
      where: { id, organizationId: organization.id, deletedAt: null },
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
      },
    });
    if (result.count === 0) return actionError('That category no longer exists.');

    revalidatePath('/categories');
    revalidatePath('/products');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/** Categories are only removable once nothing references them. */
export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  try {
    const { organization } = await requirePermission('products.delete');

    const inUse = await db.product.count({
      where: { organizationId: organization.id, categoryId: id, deletedAt: null },
    });
    if (inUse > 0) {
      return actionError(
        `${inUse} product${inUse === 1 ? '' : 's'} still use this category. Move them first.`,
      );
    }

    const result = await db.productCategory.updateMany({
      where: { id, organizationId: organization.id, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) return actionError('That category no longer exists.');

    revalidatePath('/categories');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

async function skuTaken(organizationId: string, sku: string, exceptId?: string) {
  const existing = await db.product.findFirst({
    where: {
      organizationId,
      sku,
      deletedAt: null,
      ...(exceptId ? { NOT: { id: exceptId } } : {}),
    },
    select: { id: true },
  });
  return Boolean(existing);
}

/** Raises a low-stock notification when a product crosses its reorder point. */
export async function checkLowStock(organizationId: string, productId: string) {
  const product = await db.product.findFirst({
    where: { id: productId, organizationId, trackInventory: true, deletedAt: null },
    select: { id: true, name: true, stockQuantity: true, minStockLevel: true },
  });
  if (!product) return;

  if (toNumber(product.stockQuantity) <= toNumber(product.minStockLevel)) {
    await notify({
      organizationId,
      type: 'LOW_STOCK',
      title: `${product.name} is below its reorder point`,
      body: `${toNumber(product.stockQuantity)} left against a minimum of ${toNumber(product.minStockLevel)}.`,
      href: `/products/${product.id}`,
    });
  }
}
