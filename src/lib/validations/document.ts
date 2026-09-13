import { z } from 'zod';

/**
 * Invoices and quotations share the same line-item shape and the same
 * totalling rules, so they share one schema. Only the header differs.
 */

export const documentLineSchema = z.object({
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
  discountRate: z
    .number({ message: 'Enter a discount' })
    .min(0, 'Cannot be negative')
    .max(100, 'Use 100% or less'),
  taxRate: z
    .number({ message: 'Enter a tax rate' })
    .min(0, 'Cannot be negative')
    .max(100, 'Use 100% or less'),
});

export type DocumentLineInput = z.infer<typeof documentLineSchema>;

const documentBase = {
  customerId: z.string().min(1, 'Choose a customer'),
  issueDate: z.string().min(1, 'Choose an issue date'),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z
    .number({ message: 'Enter a discount' })
    .min(0, 'Cannot be negative')
    .max(99_999_999),
  notes: z.string().trim().max(2000).optional().or(z.literal('')),
  terms: z.string().trim().max(2000).optional().or(z.literal('')),
  items: z
    .array(documentLineSchema)
    .min(1, 'Add at least one line')
    .max(200, 'That is too many lines for one document'),
};

export const invoiceSchema = z
  .object({
    ...documentBase,
    dueDate: z.string().min(1, 'Choose a due date'),
    reference: z.string().trim().max(80).optional().or(z.literal('')),
    shippingAmount: z
      .number({ message: 'Enter an amount' })
      .min(0, 'Cannot be negative')
      .max(99_999_999),
    projectId: z.string().nullable().optional(),
  })
  .refine(
    (data) => new Date(data.dueDate) >= new Date(data.issueDate),
    { message: 'The due date cannot be before the issue date', path: ['dueDate'] },
  )
  .refine(
    (data) => data.discountType !== 'PERCENTAGE' || data.discountValue <= 100,
    { message: 'A percentage discount cannot exceed 100%', path: ['discountValue'] },
  );

export type InvoiceInput = z.infer<typeof invoiceSchema>;

export const quotationSchema = z
  .object({
    ...documentBase,
    expiryDate: z.string().min(1, 'Choose an expiry date'),
  })
  .refine(
    (data) => new Date(data.expiryDate) >= new Date(data.issueDate),
    { message: 'The expiry date cannot be before the issue date', path: ['expiryDate'] },
  )
  .refine(
    (data) => data.discountType !== 'PERCENTAGE' || data.discountValue <= 100,
    { message: 'A percentage discount cannot exceed 100%', path: ['discountValue'] },
  );

export type QuotationInput = z.infer<typeof quotationSchema>;

export const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1),
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

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
