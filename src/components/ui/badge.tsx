import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium transition-colors [&>svg]:size-3 [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary-soft text-primary',
        neutral: 'border-border bg-muted text-muted-foreground',
        outline: 'border-border-strong bg-transparent text-foreground',
        success: 'border-transparent bg-success-soft text-success',
        warning: 'border-transparent bg-warning-soft text-warning-foreground',
        destructive: 'border-transparent bg-destructive-soft text-destructive',
        info: 'border-transparent bg-info-soft text-info',
        brand: 'border-transparent bg-brand-secondary-soft text-brand-secondary',
      },
      size: {
        default: '',
        sm: 'px-1.5 py-0 text-[11px]',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span';
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
