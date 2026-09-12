'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { requireTenant } from '@/server/tenant';

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

export async function markAllNotificationsRead() {
  const { organization, user } = await requireTenant();

  await db.notification.updateMany({
    where: {
      organizationId: organization.id,
      OR: [{ userId: user.id }, { userId: null }],
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  revalidatePath('/', 'layout');
  return { ok: true as const };
}
