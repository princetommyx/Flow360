'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Bell,
  CheckCheck,
  Eye,
  EyeOff,
  Trash2,
  Users,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DataTableToolbar, DataTablePagination } from '@/components/data-table/data-table';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { RowActions, type RowAction } from '@/components/shared/row-actions';
import { TimeAgo } from '@/components/shared/time-ago';
import { runAction } from '@/lib/client-action';
import { cn } from '@/lib/utils';
import {
  clearReadNotifications,
  deleteNotification,
  markAllNotificationsRead,
  markNotificationRead,
  markNotificationUnread,
} from '@/server/actions/notifications';
import type { NotificationList, NotificationRow } from '@/server/services/notifications';

const TYPE_LABELS: Record<string, string> = {
  INVOICE_PAID: 'Invoice paid',
  INVOICE_OVERDUE: 'Invoice overdue',
  QUOTE_ACCEPTED: 'Quotation accepted',
  LOW_STOCK: 'Low stock',
  PAYMENT_RECEIVED: 'Payment received',
  TASK_ASSIGNED: 'Task assigned',
  PAYROLL_PROCESSED: 'Payroll',
  SYSTEM: 'System',
};

const TYPE_TONE: Record<string, 'success' | 'warning' | 'destructive' | 'info' | 'neutral'> = {
  INVOICE_PAID: 'success',
  PAYMENT_RECEIVED: 'success',
  QUOTE_ACCEPTED: 'success',
  INVOICE_OVERDUE: 'destructive',
  LOW_STOCK: 'warning',
  TASK_ASSIGNED: 'info',
  PAYROLL_PROCESSED: 'info',
  SYSTEM: 'neutral',
};

export function NotificationInbox({
  list,
  unread,
}: {
  list: NotificationList;
  unread: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [removing, setRemoving] = React.useState<NotificationRow | null>(null);
  const [clearing, setClearing] = React.useState(false);

  const readCount = list.total - unread;

  async function toggleRead(row: NotificationRow) {
    const result = row.read
      ? await runAction(() => markNotificationUnread(row.id))
      : await runAction(async () => {
          await markNotificationRead(row.id);
          return { ok: true as const, data: undefined };
        });

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    router.refresh();
  }

  async function remove() {
    if (!removing) return;
    const result = await runAction(() => deleteNotification(removing.id));

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success('Notification removed');
    setRemoving(null);
    router.refresh();
  }

  async function clearRead() {
    const result = await runAction(() => clearReadNotifications());

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(
      result.data.count === 1
        ? '1 read notification cleared'
        : `${result.data.count} read notifications cleared`,
    );
    setClearing(false);
    router.refresh();
  }

  function actionsFor(row: NotificationRow): RowAction[] {
    return [
      {
        label: row.read ? 'Mark as unread' : 'Mark as read',
        icon: row.read ? EyeOff : Eye,
        onSelect: () => void toggleRead(row),
      },
      {
        label: 'Remove',
        icon: Trash2,
        destructive: true,
        separatorBefore: true,
        onSelect: () => setRemoving(row),
      },
    ];
  }

  return (
    <Card className="p-4 sm:p-5">
      <DataTableToolbar
        searchPlaceholder="Search notifications…"
        filters={[
          {
            key: 'type',
            label: 'Type',
            width: 'w-44',
            options: Object.entries(TYPE_LABELS).map(([value, label]) => ({
              value,
              label,
            })),
          },
        ]}
      >
        {unread > 0 ? (
          <Button
            variant="secondary"
            size="sm"
            loading={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await markAllNotificationsRead();
                router.refresh();
                toast.success(
                  result.count === 1
                    ? '1 notification marked as read'
                    : `${result.count} notifications marked as read`,
                );
              })
            }
          >
            {pending ? null : <CheckCheck />} Mark all read
          </Button>
        ) : null}

        {readCount > 0 ? (
          <Button variant="ghost" size="sm" onClick={() => setClearing(true)}>
            <Trash2 /> Clear read
          </Button>
        ) : null}
      </DataTableToolbar>

      {list.rows.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Nothing here"
          description="Paid invoices, overdue documents, low stock and assigned tasks all land in this inbox."
          className="mt-4"
        />
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {list.rows.map((row) => {
            const body = (
              <div className="flex min-w-0 flex-1 gap-3">
                <span
                  className={cn(
                    'mt-1.5 size-1.5 shrink-0 rounded-full',
                    row.read ? 'bg-transparent' : 'bg-primary',
                  )}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={cn(
                        'text-[13px] leading-snug',
                        row.read ? 'font-medium' : 'font-semibold',
                      )}
                    >
                      {row.title}
                    </p>
                    <Badge variant={TYPE_TONE[row.type] ?? 'neutral'} size="sm">
                      {TYPE_LABELS[row.type] ?? row.type}
                    </Badge>
                    {row.forEveryone ? (
                      <Badge variant="outline" size="sm" className="gap-1">
                        <Users className="size-3" aria-hidden /> Everyone
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-pretty text-[12.5px] leading-relaxed text-muted-foreground">
                    {row.body}
                  </p>
                  <TimeAgo
                    value={row.createdAt}
                    className="mt-1 block text-[11.5px] text-muted-foreground/80"
                  />
                </div>
              </div>
            );

            return (
              <li key={row.id} className="flex items-start gap-2 py-3.5">
                {row.href ? (
                  <Link
                    href={row.href}
                    onClick={() => {
                      if (!row.read) void toggleRead(row);
                    }}
                    className="flex min-w-0 flex-1 rounded-md transition-colors hover:bg-surface-subtle"
                  >
                    {body}
                  </Link>
                ) : (
                  body
                )}
                <RowActions
                  actions={actionsFor(row)}
                  label={`Actions for ${row.title}`}
                />
              </li>
            );
          })}
        </ul>
      )}

      {list.pageInfo.total > list.rows.length || list.pageInfo.page > 1 ? (
        <div className="mt-4">
          <DataTablePagination info={list.pageInfo} />
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(next) => !next && setRemoving(null)}
        title="Remove this notification?"
        description="It goes from your inbox only. Whatever raised it, an invoice or a stock level, is untouched."
        confirmLabel="Remove"
        destructive
        onConfirm={remove}
      />

      <ConfirmDialog
        open={clearing}
        onOpenChange={setClearing}
        title={`Clear ${readCount} read ${readCount === 1 ? 'notification' : 'notifications'}?`}
        description="Only the ones you have already read. Anything still unread stays exactly where it is."
        confirmLabel="Clear them"
        destructive
        onConfirm={clearRead}
      />
    </Card>
  );
}
