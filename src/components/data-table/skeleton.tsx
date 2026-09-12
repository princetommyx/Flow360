import { Skeleton } from '@/components/ui/skeleton';
import { range } from '@/lib/utils';

/** Loading placeholder matching the DataTable's shape. */
export function DataTableSkeleton({
  rows = 8,
  columns = 5,
  withToolbar = true,
}: {
  rows?: number;
  columns?: number;
  withToolbar?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      {withToolbar ? (
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Skeleton className="h-9 w-full max-w-xs" />
          <Skeleton className="h-9 w-32" />
        </div>
      ) : null}
      <div className="divide-y divide-border">
        <div className="flex items-center gap-4 px-4 py-3">
          {range(columns).map((index) => (
            <Skeleton key={index} className="h-3 flex-1" />
          ))}
        </div>
        {range(rows).map((rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-4 px-4 py-4">
            {range(columns).map((index) => (
              <Skeleton
                key={index}
                className="h-3.5 flex-1"
                style={{ opacity: 1 - rowIndex * 0.06 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
