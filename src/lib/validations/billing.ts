import { z } from 'zod';

import { BILLING_PERIODS, PLAN_IDS } from '@/lib/config/plans';

/**
 * Which plan, on which price. The same shape serves both routes out of the
 * chooser: a Paystack checkout for a plan that can be bought outright, and a
 * recorded request for one that has to be arranged (Enterprise, and anything
 * without a Paystack plan configured yet).
 */
export const planRequestSchema = z.object({
  plan: z.enum(PLAN_IDS, { message: 'Choose one of the available plans' }),
  // Which of the two prices they were looking at when they asked. Stored with
  // the request so the confirmation email, the billing page and whoever sets
  // the subscription up are all reading the same number.
  period: z.enum(BILLING_PERIODS, { message: 'Choose monthly or annual billing' }),
});
export type PlanRequestInput = z.infer<typeof planRequestSchema>;
