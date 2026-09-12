'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

import { NAV_GROUPS } from '@/lib/navigation';

const LABEL_OVERRIDES: Record<string, string> = {
  new: 'New',
  edit: 'Edit',
  reports: 'Reports',
  settings: 'Settings',
  'purchase-orders': 'Purchase orders',
  'stock-adjustments': 'Stock adjustments',
  invoicing: 'Invoice settings',
  tax: 'Tax settings',
  roles: 'Roles & permissions',
  profile: 'My profile',
  company: 'Company',
  users: 'Users',
  notifications: 'Notifications',
};

const NAV_LABELS = new Map(
  NAV_GROUPS.flatMap((group) => group.items).map((item) => [item.href, item.label]),
);

function labelFor(segment: string, href: string) {
  const navLabel = NAV_LABELS.get(href);
  if (navLabel) return navLabel;
  if (LABEL_OVERRIDES[segment]) return LABEL_OVERRIDES[segment];
  // Record ids are opaque cuids — show a short reference rather than the raw id.
  if (/^c[a-z0-9]{20,}$/i.test(segment)) return `#${segment.slice(-6).toUpperCase()}`;
  return segment.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
}

/** Derived from the URL so no page has to declare its own trail. */
export function Breadcrumbs({ trailingLabel }: { trailingLabel?: string }) {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, index) => {
    const href = `/${segments.slice(0, index + 1).join('/')}`;
    return { href, label: labelFor(segment, href), last: index === segments.length - 1 };
  });

  if (trailingLabel && crumbs.length > 0) {
    crumbs[crumbs.length - 1].label = trailingLabel;
  }

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex items-center gap-1 text-[12.5px] text-muted-foreground">
        <li className="shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center rounded-sm p-0.5 transition-colors hover:text-foreground"
            aria-label="Dashboard"
          >
            <Home className="size-3.5" aria-hidden />
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="flex min-w-0 items-center gap-1">
            <ChevronRight className="size-3.5 shrink-0 opacity-50" aria-hidden />
            {crumb.last ? (
              <span className="truncate font-medium text-foreground" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="truncate rounded-sm transition-colors hover:text-foreground"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
