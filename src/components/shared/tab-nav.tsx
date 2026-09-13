'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { buildQueryString } from '@/lib/query';
import { cn } from '@/lib/utils';

export type TabItem = {
  /** Value written to the `tab` query param. The first tab uses no param. */
  value: string;
  label: string;
  count?: number;
};

/**
 * URL-driven tabs.
 *
 * Each tab is a real link, so panels stay server-rendered and only the data
 * for the visible tab is queried.
 */
export function TabNav({
  tabs,
  active,
  paramName = 'tab',
}: {
  tabs: TabItem[];
  active: string;
  paramName?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <nav className="w-full overflow-x-auto border-b border-border scrollbar-thin">
      <ul className="flex min-w-max items-center gap-5">
        {tabs.map((tab, index) => {
          const isActive = active === tab.value;
          const href = `${pathname}${buildQueryString(searchParams, {
            [paramName]: index === 0 ? null : tab.value,
            page: null,
          })}`;

          return (
            <li key={tab.value}>
              <Link
                href={href}
                scroll={false}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-1.5 border-b-2 px-0.5 pb-2.5 pt-1 text-[13px] font-medium transition-colors',
                  isActive
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
                {tab.count !== undefined ? (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular',
                      isActive ? 'bg-primary-soft text-primary' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {tab.count}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
