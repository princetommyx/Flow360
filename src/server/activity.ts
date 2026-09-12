import 'server-only';

import { db } from '@/lib/db';
import type { NotificationType } from '@/generated/prisma/enums';

/** Append-only audit trail. Never throws — logging must not break a mutation. */
export async function logActivity(input: {
  organizationId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await db.activityLog.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        summary: input.summary,
        metadata: input.metadata as never,
      },
    });
  } catch {
    // Audit logging is best-effort.
  }
}

export async function notify(input: {
  organizationId: string;
  userId?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
}) {
  try {
    await db.notification.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId ?? null,
        type: input.type,
        title: input.title,
        body: input.body,
        href: input.href,
      },
    });
  } catch {
    // Notifications are best-effort.
  }
}
