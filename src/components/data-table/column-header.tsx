'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';

import { buildQueryString } from '@/lib/query';
import { cn } from '@/lib/utils';

type SortableHeaderProps = {
  sortKey: string;
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
};

/** Header cell that toggles the `sort`/`dir` query params. */
export function SortableHeader({ sortKey, children, align = 'left' }: SortableHeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeSort = searchParams.get('sort');
  const activeDir = searchParams.get('dir') === 'asc' ? 'asc' : 'desc';
  const isActive = activeSort === sortKey;
  const nextDir = isActive && activeDir === 'asc' ? 'desc' : 'asc';

  const href = `${pathname}${buildQueryString(searchParams, { sort: sortKey, dir: nextDir })}`;

  const Icon = !isActive ? ChevronsUpDown : activeDir === 'asc' ? ArrowUp : ArrowDown;

  return (
    <Link
      href={href}
      scroll={false}
      aria-sort={isActive ? (activeDir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn(
        'group inline-flex items-center gap-1 rounded-sm transition-colors hover:text-foreground',
        isActive && 'text-foreground',
        align === 'right' && 'flex-row-reverse',
        align === 'center' && 'justify-center',
      )}
    >
      {children}
      <Icon
        className={cn(
          'size-3 shrink-0 transition-opacity',
          isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-60',
        )}
        aria-hidden
      />
    </Link>
  );
}
