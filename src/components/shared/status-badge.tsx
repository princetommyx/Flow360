import { Badge } from '@/components/ui/badge';
import { statusMeta } from '@/lib/status';
import { cn } from '@/lib/utils';

type StatusBadgeProps = {
  status: string | null | undefined;
  className?: string;
  withDot?: boolean;
  size?: 'sm' | 'default';
};

const DOT_COLOR: Record<string, string> = {
  default: 'bg-primary',
  neutral: 'bg-muted-foreground',
  outline: 'bg-muted-foreground',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  info: 'bg-info',
  brand: 'bg-brand-secondary',
};

export function StatusBadge({
  status,
  className,
  withDot = true,
  size = 'default',
}: StatusBadgeProps) {
  const meta = statusMeta(status);

  return (
    <Badge variant={meta.variant} size={size} className={cn('gap-1.5', className)}>
      {withDot ? (
        <span
          className={cn('size-1.5 rounded-full', DOT_COLOR[meta.variant ?? 'neutral'])}
          aria-hidden
        />
      ) : null}
      {meta.label}
    </Badge>
  );
}
