import type { BillingPeriod, PlanId } from '@/lib/config/plans';

/**
 * Paystack, and what it needs to know about our plans.
 *
 * A plan is only purchasable when a matching Plan exists in the Paystack
 * dashboard and its code is named here. Anything without one behaves exactly
 * as Enterprise already does: the page says to get in touch rather than
 * offering a checkout that cannot complete.
 *
 * The secret key never leaves the server. The public key is safe in the
 * browser and is only there for a future inline checkout; the redirect flow
 * this uses does not need it.
 */

export const PAYSTACK_API = 'https://api.paystack.co';

/** Paystack quotes money in the minor unit: pesewas for cedis. */
export const MINOR_UNITS = 100;

export function paystackSecretKey(): string {
  return (process.env.PAYSTACK_SECRET_KEY ?? '').trim();
}

/** Live keys start `sk_live_`; test keys `sk_test_`. Worth saying out loud. */
export function paystackIsLive(): boolean {
  return paystackSecretKey().startsWith('sk_live_');
}

export function paystackEnabled(): boolean {
  return paystackSecretKey().length > 0;
}

/**
 * The Paystack plan code for one of our plans on one of our periods.
 *
 * Named per combination rather than derived, because the codes are opaque
 * (`PLN_xxxxxxxx`) and a typo in a derived name would fail at the checkout
 * rather than at configuration time.
 */
const PLAN_CODE_ENV: Record<string, string | undefined> = {
  'starter:monthly': process.env.PAYSTACK_PLAN_STARTER_MONTHLY,
  'starter:annual': process.env.PAYSTACK_PLAN_STARTER_ANNUAL,
  'business:monthly': process.env.PAYSTACK_PLAN_BUSINESS_MONTHLY,
  'business:annual': process.env.PAYSTACK_PLAN_BUSINESS_ANNUAL,
  'enterprise:monthly': process.env.PAYSTACK_PLAN_ENTERPRISE_MONTHLY,
  'enterprise:annual': process.env.PAYSTACK_PLAN_ENTERPRISE_ANNUAL,
};

export function planCodeFor(plan: PlanId, period: BillingPeriod): string | null {
  const code = (PLAN_CODE_ENV[`${plan}:${period}`] ?? '').trim();
  return code || null;
}

/** Whether this plan can actually be bought right now, rather than requested. */
export function isPurchasable(plan: PlanId, period: BillingPeriod): boolean {
  return paystackEnabled() && planCodeFor(plan, period) !== null;
}
