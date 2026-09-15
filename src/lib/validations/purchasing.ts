import { z } from 'zod';

/**
 * Purchase orders and bills.
 *
 * Both are supplier-side documents with the same line shape, so they share it.
 * Unlike a sales document there is no per-line discount: what a supplier gives
 * you is negotiated into the unit price before it reaches a purchase order, and
 * a discount the supplier applies to the whole invoice is the document-level
 * one below.
 */

export const purchaseLineSchema = z.object({
  productId: z.string().nullable().optional(),
  name: z.string().trim().min(1, 'Enter a description').max(160),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  quantity: z
    .number({ message: 'Enter a quantity' })
    .gt(0, 'Quantity must be greater than zero')
    .max(999_999),
  unit: z.string().trim().min(1).max(20),
  unitPrice: z
    .number({ message: 'Enter a price' })
    .min(0, 'Price cannot be negative')
    .max(99_999_999),
  taxRate: z
    .number({ message: 'Enter a tax rate' })
    .min(0, 'Cannot be negative')
    .max(100, 'Use 100% or less'),
});

export type PurchaseLineInput = z.infer<typeof purchaseLineSchema>;

const purchaseBase = {
  supplierId: z.string().min(1, 'Choose a supplier'),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
  items: z
    .array(purchaseLineSchema)
    .min(1, 'Add at least one line')
    .max(200, 'That is too many lines for one document'),
};

export const purchaseOrderSchema = z
  .object({
    ...purchaseBase,
    orderDate: z.string().min(1, 'Choose an order date'),
    expectedDate: z.string().optional().or(z.literal('')),
    discountAmount: z
      .number({ message: 'Enter a discount' })
      .min(0, 'Cannot be negative')
      .max(99_999_999),
  })
  .refine(
    (data) => !data.expectedDate || new Date(data.expectedDate) >= new Date(data.orderDate),
    {
      message: 'The expected date cannot be before the order date',
      path: ['expectedDate'],
    },
  );

export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;

export const billSchema = z
  .object({
    ...purchaseBase,
    purchaseOrderId: z.string().nullable().optional(),
    supplierRef: z.string().trim().max(80).optional().or(z.literal('')),
    issueDate: z.string().min(1, 'Choose an issue date'),
    dueDate: z.string().min(1, 'Choose a due date'),
  })
  .refine((data) => new Date(data.dueDate) >= new Date(data.issueDate), {
    message: 'The due date cannot be before the issue date',
    path: ['dueDate'],
  });

export type BillInput = z.infer<typeof billSchema>;

/**
 * Receiving stock against a purchase order.
 *
 * Quantities are cumulative received totals rather than deltas: the form shows
 * what has arrived so far and the reader corrects it, which is what someone
 * counting boxes against a delivery note is actually doing.
 */
export const receiveGoodsSchema = z.object({
  purchaseOrderId: z.string().min(1),
  receivedAt: z.string().min(1, 'Choose a date'),
  lines: z
    .array(
      z.object({
        itemId: z.string().min(1),
        receivedQuantity: z
          .number({ message: 'Enter a quantity' })
          .min(0, 'Cannot be negative')
          .max(999_999),
      }),
    )
    .min(1, 'Nothing to receive'),
});

export type ReceiveGoodsInput = z.infer<typeof receiveGoodsSchema>;

export const recordBillPaymentSchema = z.object({
  billId: z.string().min(1),
  amount: z
    .number({ message: 'Enter an amount' })
    .gt(0, 'Enter an amount greater than zero')
    .max(99_999_999),
  method: z.enum([
    'CASH',
    'BANK_TRANSFER',
    'CARD',
    'CHECK',
    'MOBILE_MONEY',
    'ONLINE',
    'OTHER',
  ]),
  accountId: z.string().min(1, 'Choose an account'),
  paidAt: z.string().min(1, 'Choose a date'),
  reference: z.string().trim().max(80).optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

export type RecordBillPaymentInput = z.infer<typeof recordBillPaymentSchema>;
