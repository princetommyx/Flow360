'use client';

import type { TooltipContentProps } from 'recharts';

import { formatCurrency } from '@/lib/money';

type Formatter = (value: number) => string;

/**
 * Recharts clones the `content` element and injects these props at render
 * time, so every field is optional from the call site's point of view.
 */
type ChartTooltipProps = Partial<TooltipContentProps<number, string>> & {
  formatter?: Formatter;
  /** The workspace's currency. Without it the tooltip would show the global
      default, which is not necessarily the one these figures are in. */
  currency?: string;
};

/**
 * Shared tooltip. Values are right-aligned and tabular so figures line up
 * between rows, and each series keeps its own swatch for identity.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  currency,
  formatter = (value) => formatCurrency(value, { currency }),
}: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="min-w-[10rem] rounded-lg border border-border bg-popover p-3 shadow-lg">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <ul className="grid gap-1.5">
        {payload.map((entry) => (
          <li key={String(entry.dataKey)} className="flex items-center gap-2 text-[12.5px]">
            <span
              className="size-2 shrink-0 rounded-[3px]"
              style={{ background: entry.color }}
              aria-hidden
            />
            <span className="flex-1 text-muted-foreground">{entry.name}</span>
            <span className="font-semibold tabular">{formatter(Number(entry.value ?? 0))}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
