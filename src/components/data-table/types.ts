import type { ReactNode } from 'react';

export type ColumnAlign = 'left' | 'center' | 'right';

export type DataTableColumn<T> = {
  /** Stable id; doubles as the sort key unless `sortKey` is given. */
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  sortKey?: string;
  align?: ColumnAlign;
  /** Hide the column below this breakpoint to keep narrow screens readable. */
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl';
  /** Columns the reader can toggle off appear in the column-visibility menu. */
  optional?: boolean;
  className?: string;
  headerClassName?: string;
  width?: string;
};

export type BulkAction = {
  id: string;
  label: string;
  destructive?: boolean;
};
