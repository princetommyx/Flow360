import 'server-only';

import { db } from '@/lib/db';
import { round, toNumber } from '@/lib/money';
import {
  orderByFor,
  paginationFor,
  pageInfo,
  type ListQuery,
} from '@/lib/query';
import type { Prisma } from '@/generated/prisma/client';
import type { InventoryMovement } from '@/generated/prisma/enums';

const LEVEL_SORTABLE: Record<string, Prisma.ProductOrderByWithRelationInput> = {
  name: { name: 'asc' },
  sku: { sku: 'asc' },
  stockQuantity: { stockQuantity: 'asc' },
  minStockLevel: { minStockLevel: 'asc' },
};

/**
 * Only stocked goods appear here. A service has no quantity to count, and a
 * product with tracking switched off is deliberately not being counted.
 */
function levelWhere(
  organizationId: string,
  query: ListQuery,
): Prisma.ProductWhereInput {
  const term = query.q.trim();
  const { categoryId, level } = query.filters;

  return {
    organizationId,
    deletedAt: null,
    trackInventory: true,
    type: 'GOOD',
    ...(categoryId ? { categoryId } : {}),
    ...(level === 'out' ? { stockQuantity: { lte: 0 } } : {}),
    ...(term
      ? {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { sku: { contains: term, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
}

export type StockLevelRow = {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  categoryName: string | null;
  stockQuantity: number;
  reorderLevel: number;
  costPrice: number;
  stockValue: number;
  /** At or below the reorder level, so it needs attention. */
  needsReorder: boolean;
};

export async function listStockLevels(organizationId: string, query: ListQuery) {
  const where = levelWhere(organizationId, query);

  const [products, count] = await Promise.all([
    db.product.findMany({
      where,
      orderBy: orderByFor(query, LEVEL_SORTABLE, { name: 'asc' }),
      ...paginationFor(query),
      select: {
        id: true,
        name: true,
        sku: true,
        unit: true,
        stockQuantity: true,
        minStockLevel: true,
        purchasePrice: true,
        category: { select: { name: true } },
      },
    }),
    db.product.count({ where }),
  ]);

  let rows: StockLevelRow[] = products.map((product) => {
    const quantity = toNumber(product.stockQuantity);
    const cost = toNumber(product.purchasePrice);
    const reorder = toNumber(product.minStockLevel);
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      unit: product.unit,
      categoryName: product.category?.name ?? null,
      stockQuantity: quantity,
      reorderLevel: reorder,
      costPrice: cost,
      stockValue: round(quantity * cost),
      needsReorder: quantity <= reorder,
    };
  });

  // "Needs reorder" compares two columns, which Prisma cannot express in a
  // where clause, so it is applied to the page after loading it. The count
  // therefore reflects the unfiltered page — stated rather than hidden.
  if (query.filters.level === 'reorder') {
    rows = rows.filter((row) => row.needsReorder);
  }

  return { rows, pageInfo: pageInfo(query, count) };
}

/** Stock on hand and what it is worth, across everything tracked. */
export async function inventorySummary(organizationId: string) {
  const products = await db.product.findMany({
    where: { organizationId, deletedAt: null, trackInventory: true, type: 'GOOD' },
    select: { stockQuantity: true, purchasePrice: true, minStockLevel: true },
  });

  let value = 0;
  let units = 0;
  let needsReorder = 0;
  let outOfStock = 0;

  for (const product of products) {
    const quantity = toNumber(product.stockQuantity);
    units += quantity;
    value += quantity * toNumber(product.purchasePrice);
    if (quantity <= 0) outOfStock += 1;
    else if (quantity <= toNumber(product.minStockLevel)) needsReorder += 1;
  }

  return {
    skuCount: products.length,
    units: round(units, 2),
    value: round(value),
    needsReorder,
    outOfStock,
  };
}

const MOVEMENT_SORTABLE: Record<
  string,
  Prisma.InventoryTransactionOrderByWithRelationInput
> = {
  occurredAt: { occurredAt: 'desc' },
  quantity: { quantity: 'desc' },
  type: { type: 'asc' },
  product: { product: { name: 'asc' } },
};

function movementWhere(
  organizationId: string,
  query: ListQuery,
): Prisma.InventoryTransactionWhereInput {
  const term = query.q.trim();
  const { type, productId } = query.filters;

  return {
    organizationId,
    ...(type ? { type: type as InventoryMovement } : {}),
    ...(productId ? { productId } : {}),
    ...(term
      ? {
          OR: [
            { reason: { contains: term, mode: 'insensitive' } },
            { reference: { contains: term, mode: 'insensitive' } },
            { product: { name: { contains: term, mode: 'insensitive' } } },
            { product: { sku: { contains: term, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };
}

export type StockMovementRow = {
  id: string;
  productId: string;
  productName: string;
  sku: string | null;
  unit: string;
  type: string;
  quantity: number;
  balanceAfter: number;
  reason: string | null;
  reference: string | null;
  occurredAt: Date;
};

export async function listStockMovements(organizationId: string, query: ListQuery) {
  const where = movementWhere(organizationId, query);

  const [movements, count] = await Promise.all([
    db.inventoryTransaction.findMany({
      where,
      orderBy: orderByFor(query, MOVEMENT_SORTABLE, { occurredAt: 'desc' }),
      ...paginationFor(query),
      select: {
        id: true,
        productId: true,
        type: true,
        quantity: true,
        balanceAfter: true,
        reason: true,
        reference: true,
        occurredAt: true,
        product: { select: { name: true, sku: true, unit: true } },
      },
    }),
    db.inventoryTransaction.count({ where }),
  ]);

  const rows: StockMovementRow[] = movements.map((movement) => ({
    id: movement.id,
    productId: movement.productId,
    productName: movement.product.name,
    sku: movement.product.sku,
    unit: movement.product.unit,
    type: movement.type,
    quantity: toNumber(movement.quantity),
    balanceAfter: toNumber(movement.balanceAfter),
    reason: movement.reason,
    reference: movement.reference,
    occurredAt: movement.occurredAt,
  }));

  return { rows, pageInfo: pageInfo(query, count) };
}

export async function listStockLevelsForExport(
  organizationId: string,
  query: ListQuery,
) {
  return db.product.findMany({
    where: levelWhere(organizationId, query),
    orderBy: orderByFor(query, LEVEL_SORTABLE, { name: 'asc' }),
    include: { category: { select: { name: true } } },
    take: 5000,
  });
}

export async function listStockMovementsForExport(
  organizationId: string,
  query: ListQuery,
) {
  return db.inventoryTransaction.findMany({
    where: movementWhere(organizationId, query),
    orderBy: orderByFor(query, MOVEMENT_SORTABLE, { occurredAt: 'desc' }),
    include: { product: { select: { name: true, sku: true, unit: true } } },
    take: 5000,
  });
}
