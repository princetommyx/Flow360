'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { cn } from '@/lib/utils';

const REPORTS = [
  { href: '/reports/sales', label: 'Sales' },
  { href: '/reports/expenses', label: 'Expenses' },
  { href: '/reports/financial', label: 'Profit and loss' },
  { href: '/reports/inventory', label: 'Inventory' },
];

/**
 * Moving between reports keeps the period.
 *
 * Re-picking the same three months on every tab is the fastest way to make a
 * set of reports feel like four unrelated pages.
 */
export function ReportNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();

  return (
    <nav className="w-full overflow-x-auto border-b border-border scrollbar-thin">
      <ul className="flex min-w-max items-center gap-5">
        {REPORTS.map((report) => {
          const active = pathname === report.href;
          return (
            <li key={report.href}>
              <Link
                href={query ? `${report.href}?${query}` : report.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center border-b-2 px-0.5 pb-2.5 pt-1 text-[13px] font-medium transition-colors',
                  active
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {report.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
