import { z } from 'zod';

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(''));

export const customerSchema = z.object({
  name: z.string().trim().min(2, 'Enter a contact name').max(80),
  companyName: optionalText(120),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid email address')
    .optional()
    .or(z.literal('')),
  phone: optionalText(40),
  website: optionalText(160),
  taxId: optionalText(60),
  addressLine1: optionalText(160),
  addressLine2: optionalText(160),
  city: optionalText(80),
  state: optionalText(80),
  postalCode: optionalText(24),
  country: optionalText(80),
  creditLimit: z
    .number({ message: 'Enter a number' })
    .min(0, 'Credit limit cannot be negative')
    .max(99_999_999)
    .nullable()
    .optional(),
  paymentTermDays: z
    .number({ message: 'Enter a number of days' })
    .int('Use whole days')
    .min(0, 'Cannot be negative')
    .max(365, 'Use 365 days or fewer'),
  notes: optionalText(2000),
  // No `.default()` here: it would make the schema's input and output types
  // diverge, which React Hook Form's resolver generics cannot reconcile.
  tags: z.array(z.string().trim().min(1).max(30)).max(12),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']),
});

export type CustomerInput = z.infer<typeof customerSchema>;

export const customerNoteSchema = z.object({
  customerId: z.string().min(1),
  notes: z.string().trim().max(4000),
});
