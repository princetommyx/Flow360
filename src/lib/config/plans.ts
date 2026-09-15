/**
 * Subscription plans.
 *
 * Every workspace starts on a free trial of `TRIAL_DAYS`, on the Business
 * feature set, so people evaluate the product rather than a cut-down version of
 * it.
 *
 * The prices here are the ones on the screen. Paystack holds its own copy on
 * each Plan in its dashboard, and the two have to agree to the pesewa: before
 * anyone is sent to a checkout, `startCheckoutAction` reads the live plan and
 * refuses if the figures differ, rather than charging a number nobody was
 * shown. Changing a price therefore means changing it in both places.
 */

export const TRIAL_DAYS = 30;

/**
 * What Adwuma360 charges in, which is not what a workspace trades in.
 *
 * A workspace keeps its own books in whatever currency it sells in; the
 * subscription it pays us for the software is priced separately. Leaving the
 * plan prices to fall back on the global currency would relabel them every
 * time that default moved, turning 2 cedis a month into 2 dollars a month
 * without anyone deciding to.
 *
 * Paystack settles Ghanaian accounts in cedis, so this is also the currency
 * every Plan in the dashboard must be created in.
 */
export const PLATFORM_CURRENCY = 'GHS';

export const PLAN_IDS = ['starter', 'business', 'enterprise'] as const;

export type PlanId = (typeof PLAN_IDS)[number];

export const BILLING_PERIODS = ['monthly', 'annual'] as const;

export type BillingPeriod = (typeof BILLING_PERIODS)[number];

/** The price of a plan for a period, or null where it is "talk to us". */
export function planPrice(plan: Plan, period: BillingPeriod): number | null {
  return period === 'annual' ? plan.annual : plan.monthly;
}

export type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  /** Price per month when billed monthly. `null` means "talk to us". */
  monthly: number | null;
  /** Total for a year when billed annually — not a monthly equivalent. */
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
    monthly: 1,
    annual: 3,
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
    monthly: 2,
    annual: 7,
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

/**
 * What paying yearly saves, as a whole percentage of twelve months at the
 * monthly rate. Derived rather than written into the copy, so the claim cannot
 * drift away from the prices above.
 */
export function annualSaving(plan: Plan): number | null {
  if (plan.monthly === null || plan.annual === null) return null;
  const monthlyTotal = plan.monthly * 12;
  if (monthlyTotal <= 0 || plan.annual >= monthlyTotal) return null;
  return Math.round(((monthlyTotal - plan.annual) / monthlyTotal) * 100);
}

/** The smallest saving across the paid plans, for a headline that holds. */
export function headlineAnnualSaving(): number | null {
  const savings = PLANS.map(annualSaving).filter((v): v is number => v !== null);
  return savings.length > 0 ? Math.min(...savings) : null;
}

export function findPlan(id: string | null | undefined): Plan | undefined {
  return PLANS.find((plan) => plan.id === id);
}

/**
 * A plan's feature list with "Everything in X" resolved into the features it
 * stands for.
 *
 * On the pricing page that shorthand sits next to the plan it refers to and
 * reads fine. On its own — in an email, say — it tells the reader nothing, so
 * the referenced plan's list is spliced in where the line was.
 */
export function expandedIncludes(plan: Plan): string[] {
  return plan.includes.flatMap((line) => {
    const match = /^Everything in (.+)$/.exec(line);
    if (!match) return [line];

    const referenced = PLANS.find(
      (candidate) => candidate.name.toLowerCase() === match[1].trim().toLowerCase(),
    );
    return referenced ? expandedIncludes(referenced) : [];
  });
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
 *
 * A workspace that has been through a subscription has no trial left to speak
 * of, whatever date is still sitting on the row. Its `trialEndsAt` is a
 * leftover, and counting it down at somebody whose renewal has just been
 * declined — or who cancelled last week — is both wrong and alarming, so every
 * subscription state other than none at all ends the trial here, once, rather
 * than in each of the three places that ask.
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

  if (
    organization.subscriptionStatus === 'past_due' ||
    organization.subscriptionStatus === 'cancelled'
  ) {
    return { status: 'none', daysRemaining: 0, endsAt: null, endingSoon: false };
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
