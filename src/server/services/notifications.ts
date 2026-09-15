import 'server-only';

import { db } from '@/lib/db';
import { pageInfo, paginationFor, type ListQuery, type PageInfo } from '@/lib/query';
import type { NotificationType } from '@/generated/prisma/enums';

/**
 * The notification centre's reads.
 *
 * A notification is either addressed to one person or to the whole workspace
 * (`userId` null). Both are scoped to the organization, so switching workspace
 * switches inbox, which is what a reader expects of anything under a tenant.
 */

export type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  createdAt: string;
  read: boolean;
  forEveryone: boolean;
};

export type NotificationList = {
  rows: NotificationRow[];
  pageInfo: PageInfo;
  unread: number;
  total: number;
};

function whereFor(
  organizationId: string,
  userId: string,
  query: ListQuery,
) {
  const tab = query.filters.tab;
  const type = query.filters.type;

  return {
    organizationId,
    OR: [{ userId }, { userId: null }],
    ...(tab === 'unread' ? { readAt: null } : {}),
    ...(tab === 'read' ? { NOT: { readAt: null } } : {}),
    ...(type ? { type: type as NotificationType } : {}),
    ...(query.q
      ? {
          AND: [
            {
              OR: [
                { title: { contains: query.q, mode: 'insensitive' as const } },
                { body: { contains: query.q, mode: 'insensitive' as const } },
              ],
            },
          ],
        }
      : {}),
  };
}

export async function listNotifications(
  organizationId: string,
  userId: string,
  query: ListQuery,
): Promise<NotificationList> {
  const where = whereFor(organizationId, userId, query);
  const scope = { organizationId, OR: [{ userId }, { userId: null }] };

  const [rows, total, unread, all] = await Promise.all([
    db.notification.findMany({
      where,
      // Seeded and batch-raised notifications share a timestamp to the
      // millisecond, and a tie leaves the order up to the planner: the same
      // list can come back shuffled between two renders. The id breaks it.
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      ...paginationFor(query),
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        href: true,
        createdAt: true,
        readAt: true,
        userId: true,
      },
    }),
    db.notification.count({ where }),
    db.notification.count({ where: { ...scope, readAt: null } }),
    db.notification.count({ where: scope }),
  ]);

  return {
    rows: rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      href: row.href,
      createdAt: row.createdAt.toISOString(),
      read: row.readAt !== null,
      forEveryone: row.userId === null,
    })),
    pageInfo: pageInfo(query, total),
    unread,
    total: all,
  };
}
