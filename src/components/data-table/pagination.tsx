'use client';

import * as React from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PER_PAGE_OPTIONS, buildQueryString, type PageInfo } from '@/lib/query';

type Control = 'first' | 'previous' | 'next' | 'last';

export function DataTablePagination({ info }: { info: PageInfo }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = React.useTransition();
  // Which control was pressed, so only that one shows the spinner.
  const [active, setActive] = React.useState<Control | null>(null);

  const goTo = (
    changes: Record<string, string | number | null>,
    control: Control | null = null,
  ) => {
    setActive(control);
    startTransition(() => {
      router.push(`${pathname}${buildQueryString(searchParams, changes)}`, {
        scroll: false,
      });
    });
  };

  const isFirst = info.page <= 1;
  const isLast = info.page >= info.totalPages;

  return (
    <div className="flex flex-col-reverse items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
      <p className="text-[13px] text-muted-foreground tabular">
        {info.total === 0
          ? 'No results'
          : `Showing ${info.from}–${info.to} of ${info.total}`}
      </p>

      <div className="flex w-full items-center justify-between gap-4 sm:w-auto">
        <div className="flex items-center gap-2">
          <span className="hidden text-[13px] text-muted-foreground sm:inline">
            Rows
          </span>
          <Select
            value={String(info.perPage)}
            onValueChange={(value) => goTo({ perPage: value, page: null })}
          >
            <SelectTrigger size="sm" className="w-[4.5rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PER_PAGE_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1">
          <span className="mr-2 text-[13px] text-muted-foreground tabular" aria-live="polite">
            Page {info.page} of {info.totalPages}
          </span>
          <Button
            variant="secondary"
            size="icon-sm"
            disabled={isFirst || isPending}
            loading={isPending && active === 'first'}
            onClick={() => goTo({ page: null }, 'first')}
            aria-label="First page"
          >
            {isPending && active === 'first' ? null : <ChevronsLeft />}
          </Button>
          <Button
            variant="secondary"
            size="icon-sm"
            disabled={isFirst || isPending}
            loading={isPending && active === 'previous'}
            onClick={() => goTo({ page: info.page - 1 }, 'previous')}
            aria-label="Previous page"
          >
            {isPending && active === 'previous' ? null : <ChevronLeft />}
          </Button>
          <Button
            variant="secondary"
            size="icon-sm"
            disabled={isLast || isPending}
            loading={isPending && active === 'next'}
            onClick={() => goTo({ page: info.page + 1 }, 'next')}
            aria-label="Next page"
          >
            {isPending && active === 'next' ? null : <ChevronRight />}
          </Button>
          <Button
            variant="secondary"
            size="icon-sm"
            disabled={isLast || isPending}
            loading={isPending && active === 'last'}
            onClick={() => goTo({ page: info.totalPages }, 'last')}
            aria-label="Last page"
          >
            {isPending && active === 'last' ? null : <ChevronsRight />}
          </Button>
        </div>
      </div>
    </div>
  );
}
