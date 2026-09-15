import { z } from 'zod';

/**
 * Company details and the currency the books are kept in.
 */

export const companySchema = z.object({
  name: z.string().trim().min(2, 'Enter the company name').max(120),
  legalName: z.string().trim().max(160).optional().or(z.literal('')),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid email address')
    .max(160)
    .optional()
    .or(z.literal('')),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  website: z.string().trim().max(160).optional().or(z.literal('')),
  taxId: z.string().trim().max(60).optional().or(z.literal('')),
  addressLine1: z.string().trim().max(160).optional().or(z.literal('')),
  addressLine2: z.string().trim().max(160).optional().or(z.literal('')),
  city: z.string().trim().max(80).optional().or(z.literal('')),
  state: z.string().trim().max(80).optional().or(z.literal('')),
  postalCode: z.string().trim().max(40).optional().or(z.literal('')),
  country: z.string().trim().max(80).optional().or(z.literal('')),
  industry: z.string().trim().max(80).optional().or(z.literal('')),
});

export type CompanyInput = z.infer<typeof companySchema>;

/**
 * Changing the currency a workspace trades in.
 *
 * The mode is the whole point of the form: relabelling and converting are
 * different operations with different consequences, and picking the wrong one
 * silently multiplies or fails to multiply every figure you own.
 */
export const currencyChangeSchema = z
  .object({
    to: z
      .string()
      .trim()
      .toUpperCase()
      .length(3, 'A currency code is three letters')
      .regex(/^[A-Z]{3}$/, 'A currency code is three letters'),
    mode: z.enum(['relabel', 'convert'], {
      message: 'Choose whether the figures should be converted',
    }),
    rate: z
      .number({ message: 'Enter the rate' })
      .gt(0, 'The rate must be greater than zero')
      .max(1_000_000, 'That rate is not plausible'),
    /** Typed back by the owner, so this cannot be done by a stray click. */
    confirmation: z.string().trim(),
  })
  .refine((data) => data.mode !== 'convert' || data.rate !== 1, {
    message: 'A conversion at a rate of 1 would change nothing. Relabel instead.',
    path: ['rate'],
  });

export type CurrencyChangeInput = z.infer<typeof currencyChangeSchema>;
