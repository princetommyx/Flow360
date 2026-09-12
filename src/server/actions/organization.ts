'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { ACTIVE_ORG_COOKIE, requireTenant } from '@/server/tenant';
import { provisionOrganization } from '@/server/services/provisioning';
import { logActivity } from '@/server/activity';
import { createOrganizationSchema } from '@/lib/validations/organization';
import { slugify } from '@/lib/utils';
import { actionError, actionOk, type ActionResult } from '@/server/actions/types';

/**
 * Persists the active tenant in an httpOnly cookie.
 *
 * The id is validated against the caller's memberships first, so a forged
 * cookie value can never widen access.
 */
export async function switchOrganization(organizationId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'You are not signed in.' };

  const membership = await db.organizationMember.findFirst({
    where: {
      userId: session.user.id,
      organizationId,
      status: 'ACTIVE',
      deletedAt: null,
      organization: { isActive: true, deletedAt: null },
    },
    select: { id: true },
  });

  if (!membership) return { error: 'You do not have access to that company.' };

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath('/', 'layout');
  return { error: null };
}

/** Creates an additional tenant owned by the signed-in user. */
export async function createOrganizationAction(
  input: unknown,
): Promise<ActionResult<{ organizationId: string }>> {
  const context = await requireTenant();

  const parsed = createOrganizationSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? 'Check the details entered.');
  }

  const base = slugify(parsed.data.name) || 'company';
  let slug = base;
  let suffix = 1;
  while (await db.organization.findUnique({ where: { slug }, select: { id: true } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }

  const { organizationId } = await db.$transaction((tx) =>
    provisionOrganization(tx, {
      name: parsed.data.name,
      slug,
      ownerUserId: context.user.id,
      currency: parsed.data.currency,
      country: parsed.data.country,
      email: parsed.data.email || null,
    }),
  );

  await logActivity({
    organizationId,
    userId: context.user.id,
    action: 'create',
    entityType: 'organization',
    entityId: organizationId,
    summary: `Created the company ${parsed.data.name}`,
  });

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath('/', 'layout');
  return actionOk({ organizationId });
}
