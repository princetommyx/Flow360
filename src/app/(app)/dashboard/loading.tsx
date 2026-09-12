import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { range } from '@/lib/utils';

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {range(4).map((index) => (
          <Card key={index} className="p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-4 h-7 w-32" />
            <Skeleton className="mt-4 h-3 w-28" />
          </Card>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {range(3).map((index) => (
          <Card key={index} className="p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-4 h-7 w-20" />
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="mt-6 h-[16rem] w-full" />
        </Card>
        <Card className="p-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-6 h-[16rem] w-full" />
        </Card>
      </div>
    </div>
  );
}
