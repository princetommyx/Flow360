import { z } from 'zod';

import { BILLING_PERIODS, PLAN_IDS } from '@/lib/config/plans';

/**
 * What the operator console is allowed to change.
 *
 * Narrow on purpose. Everything here is a decision about a workspace's
 * account, never about the work inside it, and the schemas are what keeps that
 * line where it is.
 */

export const setPlanSchema = z.object({
  plan: z.enum(PLAN_IDS),
  billing: z.enum(BILLING_PERIODS),
  /** Recorded on the audit entry so a decision can be explained later. */
  note: z.string().trim().max(300).optional().or(z.literal('')),
});

export type SetPlanInput = z.infer<typeof setPlanSchema>;

export const extendTrialSchema = z.object({
  days: z
    .number({ message: 'Enter the number of days' })
    .int()
    .min(1, 'At least one day')
    .max(90, 'Ninety days at most'),
  note: z.string().trim().max(300).optional().or(z.literal('')),
});

export type ExtendTrialInput = z.infer<typeof extendTrialSchema>;

export const suspendSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(4, 'Say why, so the next person reading the log understands')
    .max(300),
});

export type SuspendInput = z.infer<typeof suspendSchema>;
