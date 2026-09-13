import 'server-only';

import { db } from '@/lib/db';
import { toNumber, round } from '@/lib/money';
import {
  orderByFor,
  paginationFor,
  pageInfo,
  searchFilter,
  type ListQuery,
} from '@/lib/query';
import type { Prisma } from '@/generated/prisma/client';

const SEARCH_FIELDS = ['name', 'sku', 'barcode', 'description'] as const;

const SORTABLE: Record<string, Prisma.ProductOrderByWithRelationInput> = {
  name: { name: 'asc' },
  sku: { sku: 'asc' },
  sellingPrice: { sellingPrice: 'asc' },
  stockQuantity: { stockQuantity: 'asc' },
  createdAt: { createdAt: 'desc' },
  status: { status: 'asc' },
};

export function productWhere(
  organizationId: string,
  query: ListQuery,
): Prisma.ProductWhereInput {
  const search = searchFilter(query.q, SEARCH_FIELDS);
  const { status, categoryId, type, stock } = query.filters;

  return {
    organizationId,
    deletedAt: null,
    ...(status ? { status: status as never } : {}),
    ...(type ? { type: type as never } : {}),
    ...(categoryId ? { categoryId } : {}),
    // "Low" and "out" are computed against each row's own minimum level.
    ...(stock === 'out' ? { stockQuantity: { lte: 0 }, trackInventory: true } : {}),
    ...(search ? { OR: search } : {}),
  };
}

export type ProductListRow = {
  id: string;
  name: string;
  sku: string;
  type: string;
  unit: string;
  status: string;
  purchasePrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  trackInventory: boolean;
  categoryName: string | null;
  supplierName: string | null;
  isLow: boolean;
};

export async function listProducts(organizationId: string, query: ListQuery) {
  const where = productWhere(organizationId, query);

  // `stock=low` compares two columns, which Prisma cannot express, so the
  // matching ids are resolved in SQL first and folded into the filter.
  const lowIds =
    query.filters.stock === 'low' ? await lowStockIds(organizationId) : null;

  const finalWhere: Prisma.ProductWhereInput = lowIds
    ? { ...where, id: { in: lowIds } }
    : where;

  const [products, total] = await Promise.all([
    db.product.findMany({
      where: finalWhere,
      orderBy: orderByFor(query, SORTABLE, { createdAt: 'desc' }),
      ...paginationFor(query),
      select: {
        id: true,
        name: true,
        sku: true,
        type: true,
        unit: true,
        status: true,
        purchasePrice: true,
        sellingPrice: true,
        stockQuantity: true,
        minStockLevel: true,
        trackInventory: true,
        category: { select: { name: true } },
        supplier: { select: { name: true } },
      },
    }),
    db.product.count({ where: finalWhere }),
  ]);

  const rows: ProductListRow[] = products.map((product) => {
    const stockQuantity = toNumber(product.stockQuantity);
    const minStockLevel = toNumber(product.minStockLevel);
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      type: product.type,
      unit: product.unit,
      status: product.status,
      purchasePrice: toNumber(product.purchasePrice),
      sellingPrice: toNumber(product.sellingPrice),
      stockQuantity,
      minStockLevel,
      trackInventory: product.trackInventory,
      categoryName: product.category?.name ?? null,
      supplierName: product.supplier?.name ?? null,
      isLow: product.trackInventory && stockQuantity <= minStockLevel,
    };
  });

  return { rows, pageInfo: pageInfo(query, total) };
}

export async function lowStockIds(organizationId: string) {
  const rows = await db.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM products
    WHERE "organizationId" = ${organizationId}
      AND "deletedAt" IS NULL
      AND "trackInventory" = true
      AND "stockQuantity" <= "minStockLevel"
  `;
  return rows.map((row) => row.id);
}

export async function listProductsForExport(
  organizationId: string,
  query: ListQuery,
) {
  const lowIds =
    query.filters.stock === 'low' ? await lowStockIds(organizationId) : null;
  const where = productWhere(organizationId, query);

  return db.product.findMany({
    where: lowIds ? { ...where, id: { in: lowIds } } : where,
    orderBy: orderByFor(query, SORTABLE, { createdAt: 'desc' }),
    include: { category: { select: { name: true } }, supplier: { select: { name: true } } },
    take: 5000,
  });
}

export async function getProduct(organizationId: string, id: string) {
  return db.product.findFirst({
    where: { id, organizationId, deletedAt: null },
    include: {
      category: { select: { id: true, name: true } },
      supplier: { select: { id: true, name: true } },
    },
  });
}

export type ProductSalesSummary = {
  unitsSold: number;
  revenue: number;
  invoiceCount: number;
  stockValueAtCost: number;
  stockValueAtSale: number;
  margin: number | null;
};

export async function getProductSummary(
  organizationId: string,
  productId: string,
): Promise<ProductSalesSummary> {
  const [product, sales] = await Promise.all([
    db.product.findFirst({
      where: { id: productId, organizationId },
      select: { stockQuantity: true, purchasePrice: true, sellingPrice: true },
    }),
    db.invoiceItem.aggregate({
      where: {
        productId,
        invoice: {
          organizationId,
          deletedAt: null,
          status: { notIn: ['DRAFT', 'CANCELLED'] },
        },
      },
      _sum: { quantity: true, lineTotal: true },
      _count: { _all: true },
    }),
  ]);

  const stock = toNumber(product?.stockQuantity);
  const cost = toNumber(product?.purchasePrice);
  const price = toNumber(product?.sellingPrice);

  return {
    unitsSold: round(toNumber(sales._sum.quantity), 3),
    revenue: round(toNumber(sales._sum.lineTotal)),
    invoiceCount: sales._count._all,
    stockValueAtCost: round(stock * cost),
    stockValueAtSale: round(stock * price),
    margin: price > 0 ? round(((price - cost) / price) * 100, 1) : null,
  };
}

export async function getStockHistory(
  organizationId: string,
  productId: string,
  take = 40,
) {
  return db.inventoryTransaction.findMany({
    where: { organizationId, productId },
    orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
    take,
  });
}

/** Options for the product picker on invoices, quotes and purchase orders. */
export async function productOptions(organizationId: string) {
  return db.product.findMany({
    where: { organizationId, deletedAt: null, status: 'ACTIVE' },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      sku: true,
      unit: true,
      sellingPrice: true,
      purchasePrice: true,
      taxRate: true,
      stockQuantity: true,
      trackInventory: true,
      type: true,
    },
    take: 2000,
  });
}

export async function categoryOptions(organizationId: string) {
  return db.productCategory.findMany({
    where: { organizationId, deletedAt: null },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
}

export async function supplierOptions(organizationId: string) {
  return db.supplier.findMany({
    where: { organizationId, deletedAt: null, status: { not: 'BLOCKED' } },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, companyName: true },
  });
}

export async function listCategories(organizationId: string) {
  const categories = await db.productCategory.findMany({
    where: { organizationId, deletedAt: null },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      _count: { select: { products: { where: { deletedAt: null } } } },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    description: category.description,
    createdAt: category.createdAt,
    productCount: category._count.products,
  }));
}
