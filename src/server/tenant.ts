import 'server-only';

import { cache } from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { FORBIDDEN_DIGEST } from '@/lib/forbidden';
import {
  WILDCARD,
  hasAnyPermission,
  hasPermission,
  type PermissionKey,
} from '@/lib/permissions';

/**
 * Cookie name, not a brand string. It keeps its original namespace through
 * renames: changing it would invalidate every signed-in visitor's chosen
 * company at once, for no visible benefit.
 */
export const ACTIVE_ORG_COOKIE = 'flow360.org';

export { FORBIDDEN_DIGEST };

/** Refused by the member's role, not a fault. See `lib/forbidden.ts`. */
export class AuthorizationError extends Error {
  digest = FORBIDDEN_DIGEST;

  constructor(message = 'You do not have permission to do that.') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export type OrganizationSummary = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  currency: string;
  plan: string;
  /** ISO string so the summary stays plain when it crosses to a client. */
  trialEndsAt: string | null;
  subscriptionStatus: string;
};

export type TenantContext = {
  user: { id: string; name: string; email: string; avatarUrl: string | null };
  organization: OrganizationSummary;
  /** Every organization this user belongs to — powers the company switcher. */
  organizations: OrganizationSummary[];
  membership: { id: string; isOwner: boolean; branchId: string | null };
  role: { id: string; key: string; name: string };
  permissions: string[];
};

/**
 * Resolves the signed-in user, their active organization and the permissions
 * granted by their role in that organization.
 *
 * Memoised per request with `cache()` so a page that calls it from a layout,
 * a page and three server components still issues a single set of queries.
 * Returns `null` rather than redirecting so callers can decide.
 */
export const getTenantContext = cache(async (): Promise<TenantContext | null> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const memberships = await db.organizationMember.findMany({
    where: { userId, status: 'ACTIVE', deletedAt: null },
    orderBy: [{ isOwner: 'desc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      isOwner: true,
      branchId: true,
      organizationId: true,
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          currency: true,
          plan: true,
          trialEndsAt: true,
          subscriptionStatus: true,
          isActive: true,
          deletedAt: true,
        },
      },
      role: {
        select: {
          id: true,
          key: true,
          name: true,
          permissions: { select: { permission: { select: { key: true } } } },
        },
      },
      user: {
        select: { id: true, name: true, email: true, avatarUrl: true, isActive: true },
      },
    },
  });

  const usable = memberships.filter(
    (m) => m.organization.isActive && !m.organization.deletedAt,
  );
  if (usable.length === 0) return null;

  const cookieStore = await cookies();
  const requested = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  const active =
    usable.find((m) => m.organizationId === requested) ?? usable[0];

  if (!active.user.isActive) return null;

  const granted = active.role.permissions.map((rp) => rp.permission.key);
  // Owners keep full control even if their role row is later trimmed.
  const permissions = active.isOwner ? [WILDCARD, ...granted] : granted;

  const toSummary = (org: (typeof usable)[number]['organization']): OrganizationSummary => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    logoUrl: org.logoUrl,
    currency: org.currency,
    plan: org.plan,
    trialEndsAt: org.trialEndsAt?.toISOString() ?? null,
    subscriptionStatus: org.subscriptionStatus,
  });

  return {
    user: {
      id: active.user.id,
      name: active.user.name,
      email: active.user.email,
      avatarUrl: active.user.avatarUrl,
    },
    organization: toSummary(active.organization),
    organizations: usable.map((m) => toSummary(m.organization)),
    membership: { id: active.id, isOwner: active.isOwner, branchId: active.branchId },
    role: { id: active.role.id, key: active.role.key, name: active.role.name },
    permissions,
  };
});

/** Use in app-shell layouts, pages and server actions. Redirects when signed out. */
export async function requireTenant(): Promise<TenantContext> {
  const context = await getTenantContext();
  if (!context) redirect('/login');
  return context;
}

/** Convenience: the active organization id, already authorised. */
export async function requireOrganizationId(): Promise<string> {
  return (await requireTenant()).organization.id;
}

/**
 * Guard for a page or server action. Throws `AuthorizationError` rather than
 * redirecting so mutations surface a message instead of a silent navigation.
 */
export async function requirePermission(
  required: PermissionKey | PermissionKey[],
): Promise<TenantContext> {
  const context = await requireTenant();
  if (!hasPermission(context.permissions, required)) {
    throw new AuthorizationError();
  }
  return context;
}

/** Page-level guard that renders the "no access" screen instead of throwing. */
export async function canAccess(required: PermissionKey | PermissionKey[]) {
  const context = await getTenantContext();
  if (!context) return false;
  return hasPermission(context.permissions, required);
}

export async function canAccessAny(required: readonly PermissionKey[]) {
  const context = await getTenantContext();
  if (!context) return false;
  return hasAnyPermission(context.permissions, required);
}
