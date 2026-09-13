'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Logo } from '@/components/brand/logo';
import { SidebarNav } from '@/components/layout/sidebar-nav';
import { CompanySwitcher } from '@/components/layout/company-switcher';
import { TrialCard } from '@/components/billing/trial-status';
import type { NavGroup } from '@/lib/navigation';
import type { OrganizationSummary } from '@/server/tenant';

export function MobileSidebar({
  navGroups,
  organization,
  organizations,
}: {
  navGroups: NavGroup[];
  organization: OrganizationSummary;
  organizations: OrganizationSummary[];
}) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const [lastPath, setLastPath] = React.useState(pathname);

  // Close the drawer whenever navigation completes.
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[17.5rem] bg-sidebar p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SheetDescription className="sr-only">
          Browse modules and switch companies
        </SheetDescription>
        <div className="border-b border-sidebar-border px-4 py-3.5">
          <Logo size={28} />
        </div>
        <div className="border-b border-sidebar-border px-2 py-2">
          <CompanySwitcher active={organization} organizations={organizations} />
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <SidebarNav groups={navGroups} onNavigate={() => setOpen(false)} />
          <TrialCard organization={organization} className="mx-3 mb-4 mt-2" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
