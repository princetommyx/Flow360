import 'server-only';

import { addDays, differenceInCalendarDays, startOfMonth, subMonths } from 'date-fns';

import { db } from '@/lib/db';
import { round, toNumber } from '@/lib/money';
import { percentChange } from '@/lib/utils';
import { findPlan, planPrice, type BillingPeriod } from '@/lib/config/plans';
import { pageInfo, paginationFor, type ListQuery, type PageInfo } from '@/lib/query';

/**
 * Reads behind the operator console.
 *
 * The rule the whole file is written to: this reports *about* workspaces, not
 * *from inside* them. Names, plans, dates and counts, never a customer's
 * customers or a line of anybody's invoice. Where a number would be more
 * useful as a list, it stays a number.
 */

export type PlatformSummary = {
  organizations: number;
  active: number;
  trialing: number;
  subscribed: number;
  pastDue: number;
  cancelled: number;
  suspended: number;
  people: number;
  signupsThisMonth: number;
  signupsLastMonth: number;
  signupChange: number | null;
  trialsEndingSoon: number;
  trialsExpired: number;
  openRequests: number;
  /** What the current plans would bill per month, in `PLATFORM_CURRENCY`. */
  committedMonthly: number;
};

export async function getPlatformSummary(now = new Date()): Promise<PlatformSummary> {
  const thisMonth = startOfMonth(now);
  const lastMonth = startOfMonth(subMonths(now, 1));

  const live = { deletedAt: null };

  const [
    organizations,
    byStatus,
    suspended,
    people,
    signupsThisMonth,
    signupsLastMonth,
    trialsEndingSoon,
    trialsExpired,
    openRequests,
    subscribedPlans,
  ] = await Promise.all([
    db.organization.count({ where: live }),
    db.organization.groupBy({ by: ['subscriptionStatus'], where: live, _count: { _all: true } }),
    db.organization.count({ where: { ...live, isActive: false } }),
    db.user.count({ where: { isActive: true } }),
    db.organization.count({ where: { ...live, createdAt: { gte: thisMonth } } }),
    db.organization.count({
      where: { ...live, createdAt: { gte: lastMonth, lt: thisMonth } },
    }),
    db.organization.count({
      where: {
        ...live,
        subscriptionStatus: 'trialing',
        trialEndsAt: { gte: now, lte: addDays(now, 7) },
      },
    }),
    db.organization.count({
      where: { ...live, subscriptionStatus: 'trialing', trialEndsAt: { lt: now } },
    }),
    db.organization.count({ where: { ...live, NOT: { requestedPlan: null } } }),
    db.organization.findMany({
      where: { ...live, subscriptionStatus: 'active' },
      select: { plan: true, requestedBilling: true },
    }),
  ]);

  const countFor = (status: string) =>
    byStatus.find((row) => row.subscriptionStatus === status)?._count._all ?? 0;

  // An annual price is stated per year, so it is spread back over twelve to sit
  // in the same column as a monthly one.
  const committedMonthly = subscribedPlans.reduce((sum, org) => {
    const plan = findPlan(org.plan);
    if (!plan) return sum;
    const period: BillingPeriod = org.requestedBilling === 'annual' ? 'annual' : 'monthly';
    const price = planPrice(plan, period);
    if (price === null) return sum;
    return sum + (period === 'annual' ? price / 12 : price);
  }, 0);

  return {
    organizations,
    active: organizations - suspended,
    trialing: countFor('trialing'),
    subscribed: countFor('active'),
    pastDue: countFor('past_due'),
    cancelled: countFor('cancelled'),
    suspended,
    people,
    signupsThisMonth,
    signupsLastMonth,
    signupChange: percentChange(signupsThisMonth, signupsLastMonth),
    trialsEndingSoon,
    trialsExpired,
    openRequests,
    committedMonthly: round(committedMonthly),
  };
}

export type SignupPoint = { label: string; signups: number };

/** Sign-ups a month at a time, over the last year. */
export async function getSignupTrend(months = 12, now = new Date()): Promise<SignupPoint[]> {
  const from = startOfMonth(subMonths(now, months - 1));

  const rows = await db.organization.findMany({
    where: { deletedAt: null, createdAt: { gte: from } },
    select: { createdAt: true },
  });

  const points = new Map<string, SignupPoint>();
  for (let index = 0; index < months; index += 1) {
    const month = startOfMonth(subMonths(now, months - 1 - index));
    points.set(month.toISOString().slice(0, 7), {
      label: month.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
      signups: 0,
    });
  }

  for (const row of rows) {
    const key = startOfMonth(row.createdAt).toISOString().slice(0, 7);
    const point = points.get(key);
    if (point) point.signups += 1;
  }

  return [...points.values()];
}

export type PlanSlice = { plan: string; label: string; count: number; share: number };

export async function getPlanBreakdown(): Promise<PlanSlice[]> {
  const rows = await db.organization.groupBy({
    by: ['plan'],
    where: { deletedAt: null },
    _count: { _all: true },
  });

  const total = rows.reduce((sum, row) => sum + row._count._all, 0);

  return rows
    .map((row) => ({
      plan: row.plan,
      label: findPlan(row.plan)?.name ?? row.plan,
      count: row._count._all,
      share: total > 0 ? round((row._count._all / total) * 100, 1) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
  country: string;
  plan: string;
  planLabel: string;
  status: string;
  isActive: boolean;
  trialEndsAt: string | null;
  trialDaysLeft: number | null;
  requestedPlan: string | null;
  requestedBilling: string | null;
  members: number;
  owner: { name: string; email: string } | null;
  createdAt: string;
};

function organizationWhere(query: ListQuery) {
  const { plan, status, requested } = query.filters;

  return {
    deletedAt: null,
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: 'insensitive' as const } },
            { slug: { contains: query.q, mode: 'insensitive' as const } },
            { email: { contains: query.q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(plan ? { plan } : {}),
    ...(status === 'suspended'
      ? { isActive: false }
      : status
        ? { subscriptionStatus: status, isActive: true }
        : {}),
    ...(requested === 'yes' ? { NOT: { requestedPlan: null } } : {}),
  };
}

const SORTABLE = ['name', 'createdAt', 'plan', 'trialEndsAt'] as const;

export async function listOrganizations(
  query: ListQuery,
  now = new Date(),
): Promise<{ rows: OrganizationRow[]; pageInfo: PageInfo }> {
  const where = organizationWhere(query);
  const sort = (SORTABLE as readonly string[]).includes(query.sort) ? query.sort : 'createdAt';

  const [rows, total] = await Promise.all([
    db.organization.findMany({
      where,
      orderBy: [{ [sort]: query.dir }, { id: 'desc' }],
      ...paginationFor(query),
      select: {
        id: true,
        name: true,
        slug: true,
        country: true,
        plan: true,
        subscriptionStatus: true,
        isActive: true,
        trialEndsAt: true,
        requestedPlan: true,
        requestedBilling: true,
        createdAt: true,
        _count: { select: { members: { where: { deletedAt: null } } } },
        members: {
          where: { isOwner: true, deletedAt: null },
          take: 1,
          select: { user: { select: { name: true, email: true } } },
        },
      },
    }),
    db.organization.count({ where }),
  ]);

  return {
    rows: rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      country: row.country,
      plan: row.plan,
      planLabel: findPlan(row.plan)?.name ?? row.plan,
      status: row.subscriptionStatus,
      isActive: row.isActive,
      trialEndsAt: row.trialEndsAt?.toISOString() ?? null,
      trialDaysLeft: row.trialEndsAt
        ? differenceInCalendarDays(row.trialEndsAt, now)
        : null,
      requestedPlan: row.requestedPlan,
      requestedBilling: row.requestedBilling,
      members: row._count.members,
      owner: row.members[0]
        ? { name: row.members[0].user.name, email: row.members[0].user.email }
        : null,
      createdAt: row.createdAt.toISOString(),
    })),
    pageInfo: pageInfo(query, total),
  };
}

export type OrganizationDetail = OrganizationRow & {
  email: string | null;
  phone: string | null;
  currency: string;
  industry: string | null;
  /** Volumes only. The console never reads what is inside any of these. */
  volumes: Array<{ label: string; count: number }>;
  people: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    status: string;
    isOwner: boolean;
    lastLoginAt: string | null;
  }>;
  lastActivityAt: string | null;
  /** Whether Paystack holds a subscription that will charge this one again. */
  subscribed: boolean;
  /** End of the period already paid for. */
  subscriptionEndsAt: string | null;
  paystackCustomer: string | null;
};

export async function getOrganizationDetail(
  id: string,
  now = new Date(),
): Promise<OrganizationDetail | null> {
  const org = await db.organization.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      country: true,
      currency: true,
      industry: true,
      email: true,
      phone: true,
      plan: true,
      subscriptionStatus: true,
      isActive: true,
      trialEndsAt: true,
      requestedPlan: true,
      requestedBilling: true,
      subscriptionEndsAt: true,
      paystackCustomer: true,
      paystackSubscription: true,
      createdAt: true,
      members: {
        where: { deletedAt: null },
        orderBy: [{ isOwner: 'desc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          status: true,
          isOwner: true,
          role: { select: { name: true } },
          user: { select: { name: true, email: true, lastLoginAt: true } },
        },
      },
    },
  });

  if (!org) return null;

  const scope = { organizationId: id };
  const [customers, invoices, products, employees, projects, lastActivity] =
    await Promise.all([
      db.customer.count({ where: { ...scope, deletedAt: null } }),
      db.invoice.count({ where: { ...scope, deletedAt: null } }),
      db.product.count({ where: { ...scope, deletedAt: null } }),
      db.employee.count({ where: { ...scope, deletedAt: null } }),
      db.project.count({ where: { ...scope, deletedAt: null } }),
      db.activityLog.findFirst({
        where: scope,
        orderBy: { createdAt: 'desc' },
        // The timestamp only. What was done is the workspace's business.
        select: { createdAt: true },
      }),
    ]);

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    country: org.country,
    currency: org.currency,
    industry: org.industry,
    email: org.email,
    phone: org.phone,
    plan: org.plan,
    planLabel: findPlan(org.plan)?.name ?? org.plan,
    status: org.subscriptionStatus,
    isActive: org.isActive,
    trialEndsAt: org.trialEndsAt?.toISOString() ?? null,
    trialDaysLeft: org.trialEndsAt ? differenceInCalendarDays(org.trialEndsAt, now) : null,
    requestedPlan: org.requestedPlan,
    requestedBilling: org.requestedBilling,
    members: org.members.length,
    owner: org.members.find((m) => m.isOwner)
      ? {
          name: org.members.find((m) => m.isOwner)!.user.name,
          email: org.members.find((m) => m.isOwner)!.user.email,
        }
      : null,
    createdAt: org.createdAt.toISOString(),
    volumes: [
      { label: 'Customers', count: customers },
      { label: 'Invoices', count: invoices },
      { label: 'Products', count: products },
      { label: 'Employees', count: employees },
      { label: 'Projects', count: projects },
    ],
    people: org.members.map((member) => ({
      id: member.id,
      name: member.user.name,
      email: member.user.email,
      role: member.role.name,
      status: member.status,
      isOwner: member.isOwner,
      lastLoginAt: member.user.lastLoginAt?.toISOString() ?? null,
    })),
    lastActivityAt: lastActivity?.createdAt.toISOString() ?? null,
    subscribed: org.paystackSubscription !== null,
    subscriptionEndsAt: org.subscriptionEndsAt?.toISOString() ?? null,
    paystackCustomer: org.paystackCustomer,
  };
}

export type BillingEventRow = {
  id: string;
  type: string;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  plan: string | null;
  planLabel: string | null;
  period: string | null;
  occurredAt: string;
};

/**
 * What the payment provider has told us about one workspace.
 *
 * The ledger, not a summary of it: every event as it arrived, including the
 * failures. When a customer writes in about a charge, this is the page that
 * answers them, and a row that had been quietly rolled up into a total would
 * be no use at all.
 */
export async function listBillingEvents(
  organizationId: string,
  limit = 25,
): Promise<BillingEventRow[]> {
  const rows = await db.billingEvent.findMany({
    where: { organizationId },
    orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
    take: limit,
    select: {
      id: true,
      type: true,
      status: true,
      reference: true,
      amount: true,
      currency: true,
      plan: true,
      period: true,
      occurredAt: true,
    },
  });

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    status: row.status,
    reference: row.reference,
    amount: toNumber(row.amount),
    currency: row.currency,
    plan: row.plan,
    planLabel: row.plan ? (findPlan(row.plan)?.name ?? row.plan) : null,
    period: row.period,
    occurredAt: row.occurredAt.toISOString(),
  }));
}

export type PlanRequest = {
  organizationId: string;
  organizationName: string;
  currentPlan: string;
  currentPlanLabel: string;
  requestedPlan: string;
  requestedPlanLabel: string;
  billing: string;
  price: number | null;
  owner: { name: string; email: string } | null;
  trialEndsAt: string | null;
};

export async function listPlanRequests(): Promise<PlanRequest[]> {
  const rows = await db.organization.findMany({
    where: { deletedAt: null, NOT: { requestedPlan: null } },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      plan: true,
      requestedPlan: true,
      requestedBilling: true,
      trialEndsAt: true,
      members: {
        where: { isOwner: true, deletedAt: null },
        take: 1,
        select: { user: { select: { name: true, email: true } } },
      },
    },
  });

  return rows.map((row) => {
    const requested = findPlan(row.requestedPlan);
    const period: BillingPeriod = row.requestedBilling === 'annual' ? 'annual' : 'monthly';

    return {
      organizationId: row.id,
      organizationName: row.name,
      currentPlan: row.plan,
      currentPlanLabel: findPlan(row.plan)?.name ?? row.plan,
      requestedPlan: row.requestedPlan!,
      requestedPlanLabel: requested?.name ?? row.requestedPlan!,
      billing: period,
      price: requested ? planPrice(requested, period) : null,
      owner: row.members[0]
        ? { name: row.members[0].user.name, email: row.members[0].user.email }
        : null,
      trialEndsAt: row.trialEndsAt?.toISOString() ?? null,
    };
  });
}

export type PlatformUserRow = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  isPlatformAdmin: boolean;
  emailVerified: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  workspaces: Array<{ id: string; name: string; role: string }>;
};

export async function listPlatformUsers(
  query: ListQuery,
): Promise<{ rows: PlatformUserRow[]; pageInfo: PageInfo }> {
  const where = {
    ...(query.q
      ? {
          OR: [
            { name: { contains: query.q, mode: 'insensitive' as const } },
            { email: { contains: query.q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(query.filters.access === 'staff' ? { isPlatformAdmin: true } : {}),
    ...(query.filters.access === 'disabled' ? { isActive: false } : {}),
  };

  const [rows, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...paginationFor(query),
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        isPlatformAdmin: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
        memberships: {
          where: { deletedAt: null },
          select: {
            role: { select: { name: true } },
            organization: { select: { id: true, name: true } },
          },
        },
      },
    }),
    db.user.count({ where }),
  ]);

  return {
    rows: rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      isActive: row.isActive,
      isPlatformAdmin: row.isPlatformAdmin,
      emailVerified: row.emailVerified !== null,
      lastLoginAt: row.lastLoginAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      workspaces: row.memberships.map((m) => ({
        id: m.organization.id,
        name: m.organization.name,
        role: m.role.name,
      })),
    })),
    pageInfo: pageInfo(query, total),
  };
}

export type AuditRow = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  summary: string;
  actor: string;
  createdAt: string;
};

export async function listPlatformAudit(options?: {
  targetId?: string;
  limit?: number;
}): Promise<AuditRow[]> {
  const rows = await db.platformAuditLog.findMany({
    where: options?.targetId ? { targetId: options.targetId } : undefined,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: options?.limit ?? 25,
    select: {
      id: true,
      action: true,
      targetType: true,
      targetId: true,
      summary: true,
      createdAt: true,
      actor: { select: { name: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    targetType: row.targetType,
    targetId: row.targetId,
    summary: row.summary,
    actor: row.actor.name,
    createdAt: row.createdAt.toISOString(),
  }));
}
