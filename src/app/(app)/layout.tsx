import type { Metadata } from 'next';

import { db } from '@/lib/db';
import { AppHeader } from '@/components/layout/app-header';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { BrandStyle } from '@/components/brand/brand-style';
import { TrialBanner } from '@/components/billing/trial-banner';
import { NAV_GROUPS, filterNavByPermissions } from '@/lib/navigation';
import { hasAnyPermission, hasPermission, type PermissionKey } from '@/lib/permissions';
import { requireTenant } from '@/server/tenant';
import { getPlatformContext } from '@/server/platform';

export const dynamic = 'force-dynamic';

/**
 * Nothing behind the sign-in belongs in a search result.
 *
 * `robots.txt` asks a crawler not to fetch these; this tells one that has
 * fetched anyway not to index what it found. The two are different promises
 * and a page that matters needs both.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

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

  // Only so the account menu can offer a way in. It grants nothing: the
  // console re-checks for itself on every page and every action.
  const platform = await getPlatformContext();
  const isPlatformAdmin = platform !== null;

  const navGroups = filterNavByPermissions(
    NAV_GROUPS,
    (permission?: PermissionKey | PermissionKey[]) => {
      if (!permission) return true;
      // An array is "any of these", for an item that serves several modules.
      return Array.isArray(permission)
        ? hasAnyPermission(context.permissions, permission)
        : hasPermission(context.permissions, permission);
    },
  );

  const [notifications, unreadCount, settings] = await Promise.all([
    db.notification.findMany({
      where: {
        organizationId: context.organization.id,
        OR: [{ userId: context.user.id }, { userId: null }],
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
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
        <AppSidebar
          navGroups={navGroups}
          context={context}
          isPlatformAdmin={isPlatformAdmin}
        />

        <div className="lg:pl-[15.5rem]">
          <AppHeader
            navGroups={navGroups}
            context={context}
            unreadCount={unreadCount}
            isPlatformAdmin={isPlatformAdmin}
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
