import { z } from 'zod';

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(''));

export const expenseSchema = z.object({
  title: z.string().trim().min(2, 'Say what this was for').max(160),
  description: optionalText(1000),
  categoryId: z.string().nullable().optional(),
  supplierId: z.string().nullable().optional(),
  accountId: z.string().nullable().optional(),
  vendorName: optionalText(120),
  amount: z
    .number({ message: 'Enter an amount' })
    .gt(0, 'Enter an amount greater than zero')
    .max(99_999_999),
  taxAmount: z
    .number({ message: 'Enter an amount' })
    .min(0, 'Cannot be negative')
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
  status: z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REIMBURSED', 'REJECTED']),
  spentAt: z.string().min(1, 'Choose a date'),
  reference: optionalText(80),
  billable: z.boolean(),
});

export type ExpenseInput = z.infer<typeof expenseSchema>;

export const expenseCategorySchema = z.object({
  name: z.string().trim().min(2, 'Give the category a name').max(60),
  description: optionalText(300),
});

export type ExpenseCategoryInput = z.infer<typeof expenseCategorySchema>;
