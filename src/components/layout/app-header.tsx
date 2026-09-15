import { Breadcrumbs } from '@/components/layout/breadcrumbs';
import { GlobalSearch } from '@/components/layout/global-search';
import { MobileSidebar } from '@/components/layout/mobile-sidebar';
import {
  NotificationsMenu,
  type NotificationItem,
} from '@/components/layout/notifications-menu';
import { QuickCreate } from '@/components/layout/quick-create';
import { UserMenu } from '@/components/layout/user-menu';
import type { NavGroup } from '@/lib/navigation';
import type { TenantContext } from '@/server/tenant';

export function AppHeader({
  navGroups,
  context,
  notifications,
  unreadCount,
  isPlatformAdmin = false,
}: {
  navGroups: NavGroup[];
  context: TenantContext;
  notifications: NotificationItem[];
  unreadCount: number;
  isPlatformAdmin?: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="flex h-14 items-center gap-2 px-4 md:px-6">
        <MobileSidebar
          navGroups={navGroups}
          organization={context.organization}
          organizations={context.organizations}
        />

        <div className="hidden min-w-0 flex-1 items-center lg:flex">
          <Breadcrumbs />
        </div>

        <div className="min-w-0 flex-1 lg:max-w-sm">
          <GlobalSearch navGroups={navGroups} />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <QuickCreate permissions={context.permissions} />
          <NotificationsMenu notifications={notifications} unreadCount={unreadCount} />
          <div className="lg:hidden">
            <UserMenu
              user={context.user}
              roleName={context.role.name}
              variant="header"
              isPlatformAdmin={isPlatformAdmin}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border px-4 py-2 lg:hidden">
        <Breadcrumbs />
      </div>
    </header>
  );
}
