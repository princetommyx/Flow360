'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { requireTenant } from '@/server/tenant';
import { actionError, actionOk, type ActionResult } from '@/server/actions/types';

export async function markNotificationRead(id: string) {
  const { organization, user } = await requireTenant();

  await db.notification.updateMany({
    where: {
      id,
      organizationId: organization.id,
      OR: [{ userId: user.id }, { userId: null }],
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  revalidatePath('/', 'layout');
  return { ok: true as const };
}

/** Returns how many were still unread, so the caller can say what it did. */
export async function markAllNotificationsRead() {
  const { organization, user } = await requireTenant();

  const { count } = await db.notification.updateMany({
    where: {
      organizationId: organization.id,
      OR: [{ userId: user.id }, { userId: null }],
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  revalidatePath('/', 'layout');
  return { ok: true as const, count };
}

/**
 * Putting one back.
 *
 * Marking as read is the only thing most inboxes let you undo, and it is the
 * one worth undoing: a notification opened by accident on a phone is otherwise
 * gone from the unread list for good.
 */
export async function markNotificationUnread(id: string): Promise<ActionResult> {
  const { organization, user } = await requireTenant();

  const { count } = await db.notification.updateMany({
    where: {
      id,
      organizationId: organization.id,
      OR: [{ userId: user.id }, { userId: null }],
    },
    data: { readAt: null },
  });

  if (count === 0) return actionError('That notification is no longer there.');

  revalidatePath('/notifications');
  revalidatePath('/', 'layout');
  return actionOk();
}

export async function deleteNotification(id: string): Promise<ActionResult> {
  const { organization, user } = await requireTenant();

  const { count } = await db.notification.deleteMany({
    where: {
      id,
      organizationId: organization.id,
      OR: [{ userId: user.id }, { userId: null }],
    },
  });

  if (count === 0) return actionError('That notification is no longer there.');

  revalidatePath('/notifications');
  revalidatePath('/', 'layout');
  return actionOk();
}

/**
 * Clearing out what has been dealt with.
 *
 * Only the ones already read: nothing unread is removed by a button whose
 * whole purpose is tidying, because the one thing you have not looked at is
 * exactly the one you would miss.
 */
export async function clearReadNotifications(): Promise<ActionResult<{ count: number }>> {
  const { organization, user } = await requireTenant();

  const { count } = await db.notification.deleteMany({
    where: {
      organizationId: organization.id,
      OR: [{ userId: user.id }, { userId: null }],
      NOT: { readAt: null },
    },
  });

  revalidatePath('/notifications');
  revalidatePath('/', 'layout');
  return actionOk({ count });
}
