import { cn } from '@/lib/utils';

/**
 * A proportion, drawn.
 *
 * The number stays next to it: the bar is for comparing rows at a glance, not
 * for reading a value off, and a chart nobody can read a figure from is
 * decoration.
 */
export function ShareBar({
  share,
  color,
  className,
}: {
  share: number;
  color?: string | null;
  className?: string;
}) {
  return (
    <div
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}
      role="presentation"
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{
          width: `${Math.min(Math.max(share, 0), 100)}%`,
          background: color ?? 'var(--chart-1)',
        }}
      />
    </div>
  );
}
