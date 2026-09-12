'use client';

import * as React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { buildQueryString } from '@/lib/query';
import { cn } from '@/lib/utils';

export type ToolbarFilter = {
  /** Query-string key this control writes to. */
  key: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  allLabel?: string;
  width?: string;
};

type DataTableToolbarProps = {
  searchPlaceholder?: string;
  filters?: ToolbarFilter[];
  /** Optional columns the reader can show/hide. */
  columns?: Array<{ id: string; label: string }>;
  hiddenColumns?: string[];
  onHiddenColumnsChange?: (hidden: string[]) => void;
  children?: React.ReactNode;
  className?: string;
};

export function DataTableToolbar({
  searchPlaceholder = 'Search…',
  filters = [],
  columns = [],
  hiddenColumns = [],
  onHiddenColumnsChange,
  children,
  className,
}: DataTableToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const queryTerm = searchParams.get('q') ?? '';
  const [term, setTerm] = React.useState(queryTerm);
  const [syncedTerm, setSyncedTerm] = React.useState(queryTerm);
  const [isPending, startTransition] = React.useTransition();

  // When navigation changes `q` (back button, "Clear"), adopt it during render
  // rather than in an effect, which would cause a second pass.
  if (queryTerm !== syncedTerm) {
    setSyncedTerm(queryTerm);
    setTerm(queryTerm);
  }

  const push = React.useCallback(
    (changes: Record<string, string | null>) => {
      startTransition(() => {
        router.push(`${pathname}${buildQueryString(searchParams, changes)}`, {
          scroll: false,
        });
      });
    },
    [pathname, router, searchParams],
  );

  // Debounce the search so typing doesn't fire a request per keystroke.
  React.useEffect(() => {
    if (term === queryTerm) return;
    const timeout = setTimeout(() => push({ q: term || null }), 350);
    return () => clearTimeout(timeout);
  }, [term, queryTerm, push]);

  const activeFilters = filters.filter((filter) => searchParams.get(filter.key));
  const hasActive = activeFilters.length > 0 || queryTerm.length > 0;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-b border-border px-4 py-3 lg:flex-row lg:items-center lg:justify-between',
        className,
      )}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className={cn('pl-9', isPending && 'opacity-80')}
          />
        </div>

        {filters.map((filter) => (
          <Select
            key={filter.key}
            value={searchParams.get(filter.key) ?? 'all'}
            onValueChange={(value) => push({ [filter.key]: value === 'all' ? null : value })}
          >
            <SelectTrigger
              className={cn('w-auto min-w-[8.5rem]', filter.width)}
              aria-label={filter.label}
            >
              <SelectValue placeholder={filter.label} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{filter.allLabel ?? `All ${filter.label.toLowerCase()}`}</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        {hasActive ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTerm('');
              push({
                q: null,
                ...Object.fromEntries(filters.map((filter) => [filter.key, null])),
              });
            }}
          >
            <X /> Clear
          </Button>
        ) : null}
      </div>

      <div className="flex items-center gap-2">
        {children}
        {columns.length > 0 && onHiddenColumnsChange ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" aria-label="Toggle columns">
                <SlidersHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columns.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={!hiddenColumns.includes(column.id)}
                  onCheckedChange={(checked) =>
                    onHiddenColumnsChange(
                      checked
                        ? hiddenColumns.filter((id) => id !== column.id)
                        : [...hiddenColumns, column.id],
                    )
                  }
                  onSelect={(event) => event.preventDefault()}
                >
                  {column.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>
    </div>
  );
}
