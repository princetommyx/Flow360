import { DataTableSkeleton } from '@/components/data-table/skeleton';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { range } from '@/lib/utils';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-8 w-40" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {range(2).map((index) => (
          <Card key={index} className="p-5">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="mt-3 h-7 w-32" />
          </Card>
        ))}
      </div>
      <DataTableSkeleton columns={6} />
    </div>
  );
}
