/**
 * Subscription plans.
 *
 * Every workspace starts on a free trial of `TRIAL_DAYS`, on the Business
 * feature set, so people evaluate the product rather than a cut-down version of
 * it. Prices are the display prices; no payment provider is wired up yet, so
 * nothing here charges anyone.
 */

export const TRIAL_DAYS = 30;

export const PLAN_IDS = ['starter', 'business', 'enterprise'] as const;

export type PlanId = (typeof PLAN_IDS)[number];

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  /** Monthly price in the display currency. `null` means "talk to us". */
  monthly: number | null;
  /** Billed annually, per month. */
  annual: number | null;
  seats: string;
  featured?: boolean;
  includes: string[];
  limits: { users: string; invoices: string; companies: string };
};

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'For owner-operators getting off spreadsheets.',
    monthly: 19,
    annual: 15,
    seats: 'Up to 3 users',
    limits: { users: '3 users', invoices: '100 invoices a month', companies: '1 company' },
    includes: [
      'Invoicing, quotations and payments',
      'Customers and supplier records',
      'Products, services and stock levels',
      'Expenses and bank accounts',
      'Dashboard and standard reports',
      'CSV export and printable invoices',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    tagline: 'For teams running sales, stock and books together.',
    monthly: 49,
    annual: 39,
    seats: 'Up to 15 users',
    featured: true,
    limits: { users: '15 users', invoices: 'Unlimited invoices', companies: '3 companies' },
    includes: [
      'Everything in Starter',
      'Purchase orders, bills and goods receipt',
      'Full inventory with stock history and valuation',
      'Employees, payroll and attendance',
      'Projects, tasks and timesheets',
      'Roles and per-module permissions',
      'Multiple companies under one login',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For groups with several entities and their own rules.',
    monthly: null,
    annual: null,
    seats: 'Unlimited users',
    limits: { users: 'Unlimited users', invoices: 'Unlimited invoices', companies: 'Unlimited companies' },
    includes: [
      'Everything in Business',
      'Unlimited companies and branches',
      'Custom roles and approval rules',
      'Priority support with a named contact',
      'Onboarding and data migration',
      'Single sign-on',
    ],
  },
];

export function findPlan(id: string | null | undefined): Plan | undefined {
  return PLANS.find((plan) => plan.id === id);
}

export type TrialState = {
  status: 'trialing' | 'active' | 'expired' | 'none';
  daysRemaining: number;
  endsAt: Date | null;
  /** True in the last week, when the reminder should become prominent. */
  endingSoon: boolean;
};

/**
 * Where a workspace stands on its trial.
 *
 * Days remaining is rounded up, so the last partial day still reads as "1 day
 * left" rather than "0" while the trial is genuinely still running.
 */
export function trialState(
  organization: {
    /** A `Date` from Prisma, or the ISO string a client component receives. */
    trialEndsAt: Date | string | null;
    subscriptionStatus: string;
  },
  now: Date = new Date(),
): TrialState {
  if (organization.subscriptionStatus === 'active') {
    return { status: 'active', daysRemaining: 0, endsAt: null, endingSoon: false };
  }

  if (!organization.trialEndsAt) {
    return { status: 'none', daysRemaining: 0, endsAt: null, endingSoon: false };
  }

  const endsAt =
    organization.trialEndsAt instanceof Date
      ? organization.trialEndsAt
      : new Date(organization.trialEndsAt);

  if (Number.isNaN(endsAt.getTime())) {
    return { status: 'none', daysRemaining: 0, endsAt: null, endingSoon: false };
  }

  const millis = endsAt.getTime() - now.getTime();
  if (millis <= 0) {
    return { status: 'expired', daysRemaining: 0, endsAt, endingSoon: true };
  }

  const daysRemaining = Math.ceil(millis / 86_400_000);
  return { status: 'trialing', daysRemaining, endsAt, endingSoon: daysRemaining <= 7 };
}
