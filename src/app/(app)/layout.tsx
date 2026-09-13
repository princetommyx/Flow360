import { db } from '@/lib/db';
import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { BrandStyle } from '@/components/brand/brand-style';
import { TrialBanner } from '@/components/billing/trial-banner';
import { NAV_GROUPS, filterNavByPermissions } from '@/lib/navigation';
import { hasPermission, type PermissionKey } from '@/lib/permissions';
import { requireTenant } from '@/server/tenant';

export const dynamic = 'force-dynamic';

/**
 * Authenticated shell.
 *
 * `requireTenant()` runs before anything renders, so no page under this layout
 * can be reached without an active membership, and the navigation is filtered
 * to what the member's role actually allows.
 */
export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const context = await requireTenant();

  const navGroups = filterNavByPermissions(NAV_GROUPS, (permission?: PermissionKey) =>
    permission ? hasPermission(context.permissions, permission) : true,
  );

  const [notifications, unreadCount, settings] = await Promise.all([
    db.notification.findMany({
      where: {
        organizationId: context.organization.id,
        OR: [{ userId: context.user.id }, { userId: null }],
      },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { id: true, title: true, body: true, href: true, createdAt: true, readAt: true },
    }),
    db.notification.count({
      where: {
        organizationId: context.organization.id,
        OR: [{ userId: context.user.id }, { userId: null }],
        readAt: null,
      },
    }),
    db.companySettings.findUnique({
      where: { organizationId: context.organization.id },
      select: { primaryColor: true, secondaryColor: true },
    }),
  ]);

  return (
    <>
      <BrandStyle
        primary={settings?.primaryColor}
        secondary={settings?.secondaryColor}
      />
      <div className="min-h-dvh bg-background">
        <AppSidebar navGroups={navGroups} context={context} />

        <div className="lg:pl-[15.5rem]">
          <AppHeader
            navGroups={navGroups}
            context={context}
            unreadCount={unreadCount}
            notifications={notifications.map((notification) => ({
              id: notification.id,
              title: notification.title,
              body: notification.body,
              href: notification.href,
              createdAt: notification.createdAt.toISOString(),
              read: notification.readAt !== null,
            }))}
          />

          <main className="mx-auto w-full max-w-[95rem] px-4 py-6 md:px-6 md:py-8">
            <TrialBanner organization={context.organization} />
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
