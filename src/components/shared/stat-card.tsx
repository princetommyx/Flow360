import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';

import { Card } from '@/components/ui/card';

import { cn } from '@/lib/utils';

type StatCardProps = {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  change?: number | null;
  /** For costs, a rise is bad — flips the colour of the delta chip. */
  invertChange?: boolean;
  comparisonLabel?: string;
  footer?: React.ReactNode;
  href?: string;
  className?: string;
};

/**
 * A metric tile: one number, its period-over-period delta, and optional
 * supporting detail. Deliberately not a chart — magnitude here is a headline.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  change,
  invertChange = false,
  comparisonLabel = 'vs previous period',
  footer,
  className,
}: StatCardProps) {
  const hasChange = change !== null && change !== undefined && Number.isFinite(change);
  const positive = hasChange ? (invertChange ? change! < 0 : change! > 0) : false;
  const flat = hasChange && Math.abs(change!) < 0.05;
  const DeltaIcon = flat ? Minus : change! > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className={cn('hover-lift p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[12.5px] font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <span className="flex size-8 items-center justify-center rounded-lg bg-surface-subtle text-muted-foreground">
            <Icon className="size-4" aria-hidden />
          </span>
        ) : null}
      </div>

      <p className="mt-3 text-[26px] font-semibold leading-none tracking-[-0.025em] tabular">
        {value}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
        {hasChange ? (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11.5px] font-semibold tabular',
              flat
                ? 'bg-muted text-muted-foreground'
                : positive
                  ? 'bg-success-soft text-success'
                  : 'bg-destructive-soft text-destructive',
            )}
          >
            <DeltaIcon className="size-3" aria-hidden />
            {/* The arrow carries the direction, so the number stays unsigned. */}
            {Math.abs(change!).toFixed(1)}%
          </span>
        ) : null}
        {footer ?? (
          <span className="text-[11.5px] text-muted-foreground">{comparisonLabel}</span>
        )}
      </div>
    </Card>
  );
}
