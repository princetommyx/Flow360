import 'server-only';

import { cache } from 'react';
import { notFound, redirect } from 'next/navigation';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { isBootstrapAdmin, isStaffDomain } from '@/lib/config/platform';

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
  /** How they got in, so the console can say so rather than leave it a mystery. */
  via: 'flag' | 'address' | 'domain';
};

export const getPlatformContext = cache(async (): Promise<PlatformContext | null> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      isPlatformAdmin: true,
      emailVerified: true,
    },
  });

  if (!user || !user.isActive) return null;

  /*
    The domain rule carries a condition the other two do not. It is a wildcard:
    it says "whoever holds an address here is staff", and anyone can type an
    address into the registration form. Requiring the address to be confirmed
    means they had to receive the email, which means they really do hold it.

    The named-address list is exempt deliberately. It is the emergency door,
    it names one address rather than a whole domain, and adding a condition to
    it would be most likely to fail at exactly the moment it is needed.
  */
  const via = user.isPlatformAdmin
    ? 'flag'
    : isBootstrapAdmin(user.email)
      ? 'address'
      : user.emailVerified && isStaffDomain(user.email)
        ? 'domain'
        : null;

  if (!via) return null;

  return {
    user: { id: user.id, name: user.name, email: user.email },
    via,
  };
});

/**
 * Guard for every page and every action under the console.
 *
 * A signed-in visitor who is not an operator gets the ordinary not-found page,
 * the same one a mistyped address gets. Saying "this area is for staff" would
 * be answering a question nobody is entitled to ask: it confirms that a
 * console exists, that this is its address, and that the only thing between
 * them and it is the right account. For anyone who should not be here, the
 * honest answer is that there is nothing here.
 *
 * Signed out still goes to sign in, which is what every protected address in
 * the product does and so singles this one out for nothing.
 */
export async function requirePlatformAdmin(): Promise<PlatformContext> {
  const session = await auth();
  if (!session?.user?.id) redirect('/login?next=/admin');

  const context = await getPlatformContext();
  if (!context) notFound();

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
