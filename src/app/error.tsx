'use client';

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Surfaces the digest in the server log so the failure can be traced.
    console.error('Unhandled application error', error);
  }, [error]);

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-destructive-soft text-destructive">
        <AlertTriangle className="size-5" aria-hidden />
      </div>
      <h1 className="mt-5 text-xl font-semibold tracking-[-0.02em]">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-pretty text-[13.5px] leading-relaxed text-muted-foreground">
        The page failed to load. Try again — if it keeps happening, the reference
        below will help us track it down.
      </p>
      {error.digest ? (
        <code className="mt-3 rounded-md border border-border bg-surface-subtle px-2 py-1 font-mono text-[11.5px] text-muted-foreground">
          {error.digest}
        </code>
      ) : null}
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
