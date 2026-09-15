import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { isBootstrapAdmin } from '@/lib/config/platform';
import { AuthorizationError } from '@/server/tenant';

/**
 * The operator console's guard.
 *
 * Deliberately shares nothing with `server/tenant`: no active-organization
 * cookie, no membership, no role, no permission keys. Being the owner of a
 * workspace must not be a route into this, and being here must not be a route
 * into anybody's workspace.
 */

export type PlatformContext = {
  user: { id: string; name: string; email: string };
  /** Granted by the environment list rather than by a flag in the database. */
  viaBootstrap: boolean;
};

export const getPlatformContext = cache(async (): Promise<PlatformContext | null> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, isActive: true, isPlatformAdmin: true },
  });

  if (!user || !user.isActive) return null;

  const bootstrap = isBootstrapAdmin(user.email);
  if (!user.isPlatformAdmin && !bootstrap) return null;

  return {
    user: { id: user.id, name: user.name, email: user.email },
    viaBootstrap: bootstrap && !user.isPlatformAdmin,
  };
});

/**
 * Guard for every page and every action under the console.
 *
 * Signed out redirects to sign in. Signed in but not an operator throws, so
 * the refusal is a refusal: a redirect would tell anyone who tried that the
 * address is worth trying again from another account.
 */
export async function requirePlatformAdmin(): Promise<PlatformContext> {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?next=/admin');

  const context = await getPlatformContext();
  if (!context) {
    throw new AuthorizationError('This area is for Adwuma360 staff.');
  }

  return context;
}

/** Append-only record of everything the console changes. Never throws. */
export async function logPlatformAction(input: {
  actorUserId: string;
  action: string;
  targetType: 'organization' | 'user';
  targetId: string;
  summary: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await db.platformAuditLog.create({
      data: {
        actorUserId: input.actorUserId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        summary: input.summary,
        metadata: input.metadata as never,
      },
    });
  } catch (error) {
    // An audit row that cannot be written must not silently succeed either, so
    // it is at least shouted into the server log.
    console.error('Platform audit entry could not be written', error);
  }
}
