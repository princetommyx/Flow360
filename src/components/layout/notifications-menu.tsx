'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { EmptyState } from '@/components/shared/empty-state';
import { markAllNotificationsRead, markNotificationRead } from '@/server/actions/notifications';
import { TimeAgo } from '@/components/shared/time-ago';
import { cn } from '@/lib/utils';

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  href: string | null;
  createdAt: string;
  read: boolean;
};

export function NotificationsMenu({
  notifications,
  unreadCount,
}: {
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function open_(id: string, href: string | null) {
    startTransition(async () => {
      await markNotificationRead(id);
      router.refresh();
    });
    if (href) {
      setOpen(false);
      router.push(href);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[21rem] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-[13px] font-semibold">Notifications</p>
          {unreadCount > 0 ? (
            <Button
              variant="ghost"
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
        </div>

        {notifications.length === 0 ? (
          <EmptyState
            compact
            icon={Bell}
            title="You're all caught up"
            description="Payments, overdue invoices and stock alerts will show up here."
          />
        ) : (
          <ul className="max-h-[22rem] divide-y divide-border overflow-y-auto scrollbar-thin">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => open_(notification.id, notification.href)}
                  className="flex w-full gap-2.5 px-4 py-3 text-left transition-colors hover:bg-surface-subtle"
                >
                  <span
                    className={cn(
                      'mt-1.5 size-1.5 shrink-0 rounded-full',
                      notification.read ? 'bg-transparent' : 'bg-primary',
                    )}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-medium leading-snug">
                      {notification.title}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] leading-relaxed text-muted-foreground">
                      {notification.body}
                    </span>
                    <TimeAgo
                      value={notification.createdAt}
                      className="mt-1 block text-[11px] text-muted-foreground/80"
                    />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-border px-4 py-2.5">
          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="text-[13px] font-medium text-primary hover:underline"
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
