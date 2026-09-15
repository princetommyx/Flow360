import { EmptyState } from '@/components/shared/empty-state';
import { cn } from '@/lib/utils';

export type RankedColumn<T> = {
  header: string;
  /** Right-aligns and applies `tabular`, which every figure column wants. */
  numeric?: boolean;
  cell: (row: T) => React.ReactNode;
  className?: string;
};

/**
 * The small ranked tables a report is mostly made of.
 *
 * Not `components/data-table`: that one owns URL state, sorting, pagination
 * and row selection, none of which a fixed top-ten inside a card has any use
 * for. This is a table, not a list view.
 */
export function RankedTable<T>({
  rows,
  columns,
  keyOf,
  emptyTitle,
  emptyDescription,
}: {
  rows: T[];
  columns: Array<RankedColumn<T>>;
  keyOf: (row: T) => string;
  emptyTitle: string;
  emptyDescription?: string;
}) {
  if (rows.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[26rem] border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-border">
            {columns.map((column) => (
              <th
                key={column.header}
                scope="col"
                className={cn(
                  'pb-2 text-[11.5px] font-medium uppercase tracking-wider text-muted-foreground',
                  column.numeric ? 'text-right' : 'text-left',
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={keyOf(row)} className="border-b border-border/60 last:border-0">
              {columns.map((column) => (
                <td
                  key={column.header}
                  className={cn(
                    'py-2.5',
                    column.numeric ? 'tabular text-right' : 'text-left',
                    column.className,
                  )}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
