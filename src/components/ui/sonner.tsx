'use client';

import { Toaster as SonnerToaster } from 'sonner';

/** App-wide toast host. Mounted once in the root layout. */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      offset={16}
      toastOptions={{
        classNames: {
          toast:
            'group flex w-full items-start gap-3 rounded-lg border border-border bg-surface p-4 text-sm shadow-lg',
          title: 'font-medium text-foreground',
          description: 'text-[13px] text-muted-foreground',
          actionButton: 'rounded-md bg-primary px-2.5 py-1 text-xs text-primary-foreground',
          cancelButton: 'rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground',
          success: '[&_[data-icon]]:text-success',
          error: '[&_[data-icon]]:text-destructive',
          warning: '[&_[data-icon]]:text-warning',
          info: '[&_[data-icon]]:text-info',
        },
      }}
    />
  );
}
