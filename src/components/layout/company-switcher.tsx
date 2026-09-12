'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronsUpDown, Plus, Settings } from 'lucide-react';
import { toast } from 'sonner';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { switchOrganization } from '@/server/actions/organization';
import { initials, cn } from '@/lib/utils';
import type { OrganizationSummary } from '@/server/tenant';

type CompanySwitcherProps = {
  active: OrganizationSummary;
  organizations: OrganizationSummary[];
  className?: string;
};

/** Switches the active tenant; the id is persisted in an httpOnly cookie. */
export function CompanySwitcher({
  active,
  organizations,
  className,
}: CompanySwitcherProps) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function select(organizationId: string) {
    if (organizationId === active.id) return;
    startTransition(async () => {
      const result = await switchOrganization(organizationId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent',
          pending && 'opacity-60',
          className,
        )}
        aria-label="Switch company"
      >
        <Avatar className="size-8 rounded-lg">
          {active.logoUrl ? <AvatarImage src={active.logoUrl} alt="" /> : null}
          <AvatarFallback className="rounded-lg">{initials(active.name)}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-semibold leading-tight">
            {active.name}
          </span>
          <span className="block truncate text-[11.5px] capitalize text-sidebar-muted">
            {active.plan} plan
          </span>
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-sidebar-muted" aria-hidden />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-[15rem]">
        <DropdownMenuLabel>Companies</DropdownMenuLabel>
        {organizations.map((organization) => (
          <DropdownMenuItem
            key={organization.id}
            onSelect={() => select(organization.id)}
            className="gap-2.5"
          >
            <Avatar className="size-6 rounded-md">
              {organization.logoUrl ? (
                <AvatarImage src={organization.logoUrl} alt="" />
              ) : null}
              <AvatarFallback className="rounded-md text-[10px]">
                {initials(organization.name)}
              </AvatarFallback>
            </Avatar>
            <span className="min-w-0 flex-1 truncate">{organization.name}</span>
            {organization.id === active.id ? (
              <Check className="size-4 text-primary" aria-hidden />
            ) : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/settings/company">
            <Settings aria-hidden />
            Company settings
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href="/onboarding/new-company">
            <Plus aria-hidden />
            Add another company
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
