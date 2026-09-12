import { cn } from '@/lib/utils';

export type LegendEntry = { label: string; color: string; value?: string };

/** Identity is never colour alone — every series is named next to its swatch. */
export function ChartLegend({
  entries,
  className,
}: {
  entries: LegendEntry[];
  className?: string;
}) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5', className)}>
      {entries.map((entry) => (
        <li key={entry.label} className="flex items-center gap-1.5 text-[12px]">
          <span
            className="size-2 shrink-0 rounded-[3px]"
            style={{ background: entry.color }}
            aria-hidden
          />
          <span className="text-muted-foreground">{entry.label}</span>
          {entry.value ? (
            <span className="font-semibold text-foreground tabular">{entry.value}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
