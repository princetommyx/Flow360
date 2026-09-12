import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  className?: string;
  compact?: boolean;
};

/** The single empty-state treatment used by every list, table and panel. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center px-6 text-center',
        compact ? 'py-10' : 'py-16',
        className,
      )}
    >
      {Icon ? (
        <div className="mb-4 flex size-11 items-center justify-center rounded-xl border border-border bg-surface-subtle text-muted-foreground">
          <Icon className="size-5" aria-hidden />
        </div>
      ) : null}
      <p className="text-[15px] font-semibold tracking-[-0.01em]">{title}</p>
      {description ? (
        <p className="mt-1.5 max-w-sm text-pretty text-[13px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action || secondaryAction ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      ) : null}
    </div>
  );
}
