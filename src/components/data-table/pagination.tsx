'use client';

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

export function DataTablePagination({ info }: { info: PageInfo }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goTo = (changes: Record<string, string | number | null>) => {
    router.push(`${pathname}${buildQueryString(searchParams, changes)}`, {
      scroll: false,
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
          <span className="mr-2 text-[13px] text-muted-foreground tabular">
            Page {info.page} of {info.totalPages}
          </span>
          <Button
            variant="secondary"
            size="icon-sm"
            disabled={isFirst}
            onClick={() => goTo({ page: null })}
            aria-label="First page"
          >
            <ChevronsLeft />
          </Button>
          <Button
            variant="secondary"
            size="icon-sm"
            disabled={isFirst}
            onClick={() => goTo({ page: info.page - 1 })}
            aria-label="Previous page"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="secondary"
            size="icon-sm"
            disabled={isLast}
            onClick={() => goTo({ page: info.page + 1 })}
            aria-label="Next page"
          >
            <ChevronRight />
          </Button>
          <Button
            variant="secondary"
            size="icon-sm"
            disabled={isLast}
            onClick={() => goTo({ page: info.totalPages })}
            aria-label="Last page"
          >
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
