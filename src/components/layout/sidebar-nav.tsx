'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';
import { Icon } from '@/components/shared/icon';
import { isActivePath, type NavGroup } from '@/lib/navigation';

type SidebarNavProps = {
  groups: NavGroup[];
  onNavigate?: () => void;
};

export function SidebarNav({ groups, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-6 px-3 py-4" aria-label="Main">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-3 pb-2 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-sidebar-muted/80">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group relative flex items-center gap-2.5 rounded-lg px-3 py-[7px] text-[13.5px] font-medium transition-colors',
                      active
                        ? 'bg-primary-soft text-primary'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground',
                    )}
                  >
                    <Icon
                      name={item.icon}
                      className={cn(
                        'size-[17px] shrink-0 transition-colors',
                        active ? 'text-primary' : 'text-sidebar-muted group-hover:text-foreground',
                      )}
                    />
                    <span className="truncate">{item.label}</span>
                    {active ? (
                      <span
                        className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-primary"
                        aria-hidden
                      />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
