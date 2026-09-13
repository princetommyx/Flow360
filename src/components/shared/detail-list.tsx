import { cn } from '@/lib/utils';

export type DetailItem = {
  label: string;
  value: React.ReactNode;
  /** Hide the row entirely when the value is empty. */
  hideWhenEmpty?: boolean;
  full?: boolean;
};

/** Label/value grid used on every record detail page. */
export function DetailList({
  items,
  columns = 2,
  className,
}: {
  items: DetailItem[];
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  const visible = items.filter(
    (item) => !item.hideWhenEmpty || (item.value !== null && item.value !== undefined && item.value !== ''),
  );

  return (
    <dl
      className={cn(
        'grid gap-x-6 gap-y-4',
        columns === 1 ? 'sm:grid-cols-1' : columns === 3 ? 'sm:grid-cols-3' : 'sm:grid-cols-2',
        className,
      )}
    >
      {visible.map((item) => (
        <div key={item.label} className={cn(item.full && 'sm:col-span-full')}>
          <dt className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">
            {item.label}
          </dt>
          <dd className="mt-1 text-[13.5px] leading-relaxed text-foreground">
            {item.value || <span className="text-muted-foreground">—</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}
