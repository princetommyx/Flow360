import Link from 'next/link';

import { Logo } from '@/components/brand/logo';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { CompanySwitcher } from '@/components/layout/company-switcher';
import { UserMenu } from '@/components/layout/user-menu';
import { TrialCard } from '@/components/billing/trial-status';
import type { NavGroup } from '@/lib/navigation';
import type { TenantContext } from '@/server/tenant';

/** Fixed desktop sidebar. The mobile equivalent lives in `MobileSidebar`. */
export function AppSidebar({
  navGroups,
  context,
  isPlatformAdmin = false,
}: {
  navGroups: NavGroup[];
  context: TenantContext;
  isPlatformAdmin?: boolean;
}) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[15.5rem] flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-4">
        <Link href="/dashboard" className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
          <Logo size={28} />
        </Link>
      </div>

      <div className="border-b border-sidebar-border px-2 py-2">
        <CompanySwitcher
          active={context.organization}
          organizations={context.organizations}
        />
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <SidebarNav groups={navGroups} />
      </div>

      <div className="border-t border-sidebar-border px-2 py-2">
        <TrialCard organization={context.organization} className="mx-1 mb-2" />
        <UserMenu
          user={context.user}
          roleName={context.role.name}
          isPlatformAdmin={isPlatformAdmin}
        />
      </div>
    </aside>
  );
}
