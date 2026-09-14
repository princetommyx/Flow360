import { z } from 'zod';

import { BILLING_PERIODS, PLAN_IDS } from '@/lib/config/plans';

/**
 * A plan request, not a purchase. No payment provider is connected yet, so the
 * workspace records which plan the owner asked for and nothing is charged.
 */
export const planRequestSchema = z.object({
  plan: z.enum(PLAN_IDS, { message: 'Choose one of the available plans' }),
  // Which of the two prices they were looking at when they asked. Stored with
  // the request so the confirmation email, the billing page and whoever sets
  // the subscription up are all reading the same number.
  period: z.enum(BILLING_PERIODS, { message: 'Choose monthly or annual billing' }),
});
export type PlanRequestInput = z.infer<typeof planRequestSchema>;
