import { z } from 'zod';

/**
 * A money movement entered by hand.
 *
 * Most rows in the ledger are written by something else — an invoice payment,
 * a bill payment, an expense — and those are not editable here, because the
 * document they belong to owns the figure. This covers the rest: takings, a
 * bank charge, a transfer between your own accounts.
 */

export const TRANSACTION_TYPES = ['INCOME', 'EXPENSE', 'TRANSFER'] as const;

export const transactionSchema = z
  .object({
    type: z.enum(TRANSACTION_TYPES, { message: 'Choose what kind of movement this is' }),
    accountId: z.string().min(1, 'Choose an account'),
    /** Required for a transfer: where the money goes. */
    toAccountId: z.string().nullable().optional(),
    // Always entered as a positive figure; the sign follows from the type, so
    // nobody has to remember whether an expense is typed with a minus.
    amount: z
      .number({ message: 'Enter an amount' })
      .gt(0, 'Enter an amount greater than zero')
      .max(99_999_999),
    description: z.string().trim().min(1, 'Say what this was').max(200),
    category: z.string().trim().max(80).optional().or(z.literal('')),
    occurredAt: z.string().min(1, 'Choose a date'),
    reference: z.string().trim().max(80).optional().or(z.literal('')),
  })
  .refine((data) => data.type !== 'TRANSFER' || Boolean(data.toAccountId), {
    message: 'Choose the account the money goes to',
    path: ['toAccountId'],
  })
  .refine((data) => data.type !== 'TRANSFER' || data.toAccountId !== data.accountId, {
    message: 'A transfer needs two different accounts',
    path: ['toAccountId'],
  });

export type TransactionInput = z.infer<typeof transactionSchema>;
