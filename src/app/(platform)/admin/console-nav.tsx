'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

const LINKS = [
  { href: '/admin', label: 'Overview', exact: true },
  { href: '/admin/organizations', label: 'Workspaces' },
  { href: '/admin/requests', label: 'Plan requests' },
  { href: '/admin/users', label: 'People' },
  { href: '/admin/activity', label: 'Activity' },
];

export function ConsoleNav() {
  const pathname = usePathname();

  return (
    <nav className="mx-auto w-full max-w-7xl overflow-x-auto px-5 scrollbar-thin md:px-8">
      <ul className="flex min-w-max items-center gap-5">
        {LINKS.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href);

          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center border-b-2 px-0.5 pb-2.5 pt-1 text-[13px] font-medium transition-colors',
                  active
                    ? 'border-brand-foreground text-brand-foreground'
                    : 'border-transparent text-brand-foreground/70 hover:text-brand-foreground',
                )}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
