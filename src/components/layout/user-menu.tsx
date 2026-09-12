'use client';

import * as React from 'react';
import { ChevronsUpDown, LogOut, Moon, Sun, User2 } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { signOutAction } from '@/server/actions/auth';
import { useTheme } from '@/components/layout/theme-provider';
import { initials } from '@/lib/utils';

type UserMenuProps = {
  user: { name: string; email: string; avatarUrl: string | null };
  roleName: string;
  variant?: 'sidebar' | 'header';
};

export function UserMenu({ user, roleName, variant = 'sidebar' }: UserMenuProps) {
  const { theme, toggle } = useTheme();
  const [pending, startTransition] = React.useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={
          variant === 'sidebar'
            ? 'flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-sidebar-accent'
            : 'flex items-center gap-2 rounded-full transition-opacity hover:opacity-85'
        }
        aria-label="Account menu"
      >
        <Avatar className="size-8">
          {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
          <AvatarFallback>{initials(user.name)}</AvatarFallback>
        </Avatar>
        {variant === 'sidebar' ? (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13.5px] font-medium leading-tight">
                {user.name}
              </span>
              <span className="block truncate text-[11.5px] text-sidebar-muted">
                {user.email}
              </span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-sidebar-muted" aria-hidden />
          </>
        ) : null}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-[15rem]">
        <DropdownMenuLabel className="normal-case tracking-normal">
          <span className="flex flex-col gap-1">
            <span className="text-[13px] font-semibold text-foreground">{user.name}</span>
            <span className="text-[12px] font-normal text-muted-foreground">
              {user.email}
            </span>
            <Badge variant="neutral" size="sm" className="mt-1 w-fit">
              {roleName}
            </Badge>
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href="/settings/profile">
            <User2 aria-hidden />
            Profile & password
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(event) => { event.preventDefault(); toggle(); }}>
          {theme === 'dark' ? <Sun aria-hidden /> : <Moon aria-hidden />}
          {theme === 'dark' ? 'Light appearance' : 'Dark appearance'}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={pending}
          onSelect={(event) => {
            event.preventDefault();
            startTransition(() => {
              void signOutAction();
            });
          }}
        >
          <LogOut aria-hidden />
          {pending ? 'Signing out…' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
