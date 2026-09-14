import { z } from 'zod';

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal(''));

/**
 * A place money sits. The current balance is not here on purpose: it is
 * derived from the opening balance plus every transaction, so letting someone
 * type it would let the books disagree with themselves.
 */
export const accountSchema = z.object({
  name: z.string().trim().min(2, 'Give the account a name').max(80),
  type: z.enum(['BANK', 'CASH', 'CREDIT_CARD', 'MOBILE_MONEY', 'OTHER']),
  bankName: optionalText(80),
  accountNumber: optionalText(40),
  openingBalance: z
    .number({ message: 'Enter an amount' })
    .min(-99_999_999)
    .max(99_999_999),
  description: optionalText(500),
  isPrimary: z.boolean(),
  isActive: z.boolean(),
});

export type AccountInput = z.infer<typeof accountSchema>;
