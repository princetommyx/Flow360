'use client';

import * as React from 'react';
import Link from 'next/link';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import { cn } from '@/lib/utils';
import type { PageInfo } from '@/lib/query';

import { SortableHeader } from './column-header';
import { DataTablePagination } from './pagination';
import { DataTableToolbar, type ToolbarFilter } from './toolbar';
import type { DataTableColumn } from './types';

type DataTableProps<T> = {
  columns: Array<DataTableColumn<T>>;
  rows: T[];
  rowKey: (row: T) => string;
  /** Makes each row navigate; rendered as a real link for accessibility. */
  rowHref?: (row: T) => string;
  pageInfo?: PageInfo;
  searchPlaceholder?: string;
  filters?: ToolbarFilter[];
  toolbarActions?: React.ReactNode;
  /** Shown when there are no rows at all (no search/filters applied). */
  empty: React.ReactNode;
  /** Shown when filters or a search term exclude everything. */
  emptyFiltered?: React.ReactNode;
  isFiltered?: boolean;
  /** Alternative stacked rendering below `md`, so mobile isn't a squeezed table. */
  mobileRow?: (row: T) => React.ReactNode;
  className?: string;
};

const ALIGN_CLASS = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
} as const;

const HIDE_CLASS = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
} as const;

/**
 * The app's one table. Search, filters, sorting and paging are driven by the
 * URL (see lib/query.ts), so the data itself stays server-rendered and the
 * component only owns presentation and column visibility.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  rowHref,
  pageInfo,
  searchPlaceholder,
  filters,
  toolbarActions,
  empty,
  emptyFiltered,
  isFiltered = false,
  mobileRow,
  className,
}: DataTableProps<T>) {
  const [hiddenColumns, setHiddenColumns] = React.useState<string[]>([]);

  const optionalColumns = columns
    .filter((column) => column.optional)
    .map((column) => ({ id: column.id, label: String(column.header) }));

  const visibleColumns = columns.filter(
    (column) => !hiddenColumns.includes(column.id),
  );

  const showToolbar = Boolean(searchPlaceholder || filters?.length || toolbarActions);

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-card shadow-sm',
        className,
      )}
    >
      {showToolbar ? (
        <DataTableToolbar
          searchPlaceholder={searchPlaceholder}
          filters={filters}
          columns={optionalColumns}
          hiddenColumns={hiddenColumns}
          onHiddenColumnsChange={setHiddenColumns}
        >
          {toolbarActions}
        </DataTableToolbar>
      ) : null}

      {rows.length === 0 ? (
        isFiltered ? (
          (emptyFiltered ?? (
            <EmptyState
              title="No matches"
              description="Try a different search term or clear the filters."
            />
          ))
        ) : (
          empty
        )
      ) : (
        <>
          {/* Stacked cards on small screens when the caller provides a layout */}
          {mobileRow ? (
            <ul className="divide-y divide-border md:hidden">
              {rows.map((row) => {
                const content = (
                  <div className="px-4 py-3.5">{mobileRow(row)}</div>
                );
                return (
                  <li key={rowKey(row)}>
                    {rowHref ? (
                      <Link
                        href={rowHref(row)}
                        className="block transition-colors hover:bg-surface-subtle"
                      >
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
            </ul>
          ) : null}

          <div className={cn(mobileRow && 'hidden md:block')}>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {visibleColumns.map((column) => (
                    <TableHead
                      key={column.id}
                      style={column.width ? { width: column.width } : undefined}
                      className={cn(
                        ALIGN_CLASS[column.align ?? 'left'],
                        column.hideBelow && HIDE_CLASS[column.hideBelow],
                        column.headerClassName,
                      )}
                    >
                      {column.sortable ? (
                        <SortableHeader
                          sortKey={column.sortKey ?? column.id}
                          align={column.align}
                        >
                          {column.header}
                        </SortableHeader>
                      ) : (
                        column.header
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={rowKey(row)} className="group">
                    {visibleColumns.map((column, index) => {
                      const content = column.cell(row);
                      return (
                        <TableCell
                          key={column.id}
                          className={cn(
                            ALIGN_CLASS[column.align ?? 'left'],
                            column.hideBelow && HIDE_CLASS[column.hideBelow],
                            column.className,
                          )}
                        >
                          {rowHref && index === 0 ? (
                            <Link
                              href={rowHref(row)}
                              className="-m-1 block rounded-sm p-1 outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                            >
                              {content}
                            </Link>
                          ) : (
                            content
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {pageInfo && pageInfo.total > 0 ? <DataTablePagination info={pageInfo} /> : null}
    </div>
  );
}

export { DataTableToolbar, DataTablePagination, SortableHeader };
export type { DataTableColumn, ToolbarFilter };
