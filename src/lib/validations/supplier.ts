import { z } from 'zod';

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(''));

/**
 * Suppliers mirror customers, minus the things that only make sense when money
 * is coming towards you: there is no credit limit, because the limit on what a
 * supplier will extend is theirs to set, not yours to record here.
 */
export const supplierSchema = z.object({
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
  city: optionalText(80),
  state: optionalText(80),
  postalCode: optionalText(24),
  country: optionalText(80),
  paymentTermDays: z
    .number({ message: 'Enter a number of days' })
    .int('Use whole days')
    .min(0, 'Cannot be negative')
    .max(365, 'Use 365 days or fewer'),
  notes: optionalText(2000),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED']),
});

export type SupplierInput = z.infer<typeof supplierSchema>;
