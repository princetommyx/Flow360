'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';

/**
 * The console breaking.
 *
 * There is deliberately no "you are not allowed" branch here: a visitor who
 * does not operate the platform is shown the ordinary not-found page instead,
 * so this address gives nothing away about itself. Anything that reaches this
 * boundary is a genuine fault.
 */
export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('Operator console error', error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-destructive-soft text-destructive">
        <AlertTriangle className="size-5" aria-hidden />
      </div>

      <h1 className="mt-5 text-xl font-semibold tracking-[-0.02em]">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-pretty text-[13.5px] leading-relaxed text-muted-foreground">
        The console failed to load. Try again, and if it keeps happening the
        reference below will help track it down.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button variant="secondary" asChild>
          <Link href="/dashboard">Go to my workspace</Link>
        </Button>
      </div>

      {error.digest ? (
        <code className="mt-4 rounded-md border border-border bg-surface-subtle px-2 py-1 font-mono text-[11.5px] text-muted-foreground">
          {error.digest}
        </code>
      ) : null}
    </div>
  );
}
