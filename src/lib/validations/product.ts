import { z } from 'zod';

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(''));

const money = (label: string) =>
  z
    .number({ message: `Enter ${label}` })
    .min(0, `${label} cannot be negative`)
    .max(99_999_999);

export const productSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter a product name').max(120),
    sku: z
      .string()
      .trim()
      .min(1, 'Enter a SKU')
      .max(40)
      .regex(/^[A-Za-z0-9._/-]+$/, 'Use letters, numbers, dots, dashes or slashes'),
    barcode: optionalText(60),
    description: optionalText(2000),
    type: z.enum(['GOOD', 'SERVICE']),
    categoryId: z.string().nullable().optional(),
    supplierId: z.string().nullable().optional(),
    unit: z.string().trim().min(1, 'Enter a unit').max(20),
    purchasePrice: money('a purchase price'),
    sellingPrice: money('a selling price'),
    taxRate: z
      .number({ message: 'Enter a tax rate' })
      .min(0, 'Cannot be negative')
      .max(100, 'Use 100% or less'),
    stockQuantity: z
      .number({ message: 'Enter a quantity' })
      .min(0, 'Opening stock cannot be negative')
      .max(9_999_999),
    minStockLevel: z
      .number({ message: 'Enter a minimum level' })
      .min(0, 'Cannot be negative')
      .max(9_999_999),
    trackInventory: z.boolean(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']),
  })
  .refine((data) => data.type === 'SERVICE' || !data.trackInventory || data.unit.length > 0, {
    message: 'Tracked goods need a unit',
    path: ['unit'],
  });

export type ProductInput = z.infer<typeof productSchema>;

export const productCategorySchema = z.object({
  name: z.string().trim().min(2, 'Enter a category name').max(60),
  description: optionalText(500),
});
export type ProductCategoryInput = z.infer<typeof productCategorySchema>;

export const stockAdjustmentSchema = z
  .object({
    productId: z.string().min(1, 'Choose a product'),
    type: z.enum(['STOCK_IN', 'STOCK_OUT', 'ADJUSTMENT']),
    /** For STOCK_IN/OUT this is a delta; for ADJUSTMENT it is the counted total. */
    quantity: z
      .number({ message: 'Enter a quantity' })
      .min(0, 'Quantity cannot be negative')
      .max(9_999_999),
    unitCost: z.number().min(0).max(99_999_999).nullable().optional(),
    reason: z.string().trim().min(3, 'Say why the stock changed').max(200),
    occurredAt: z.string().min(1, 'Choose a date'),
  })
  .refine((data) => data.type === 'ADJUSTMENT' || data.quantity > 0, {
    message: 'Enter a quantity greater than zero',
    path: ['quantity'],
  });

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
