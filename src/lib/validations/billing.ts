import { z } from 'zod';

import { PLAN_IDS } from '@/lib/config/plans';

/**
 * A plan request, not a purchase. No payment provider is connected yet, so the
 * workspace records which plan the owner asked for and nothing is charged.
 */
export const planRequestSchema = z.object({
  plan: z.enum(PLAN_IDS, { message: 'Choose one of the available plans' }),
});
export type PlanRequestInput = z.infer<typeof planRequestSchema>;
