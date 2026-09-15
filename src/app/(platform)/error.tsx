'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FORBIDDEN_DIGEST } from '@/lib/forbidden';

/** The console refusing, and the console breaking, are different things. */
export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const forbidden = error.digest === FORBIDDEN_DIGEST;

  React.useEffect(() => {
    if (!forbidden) console.error('Operator console error', error);
  }, [error, forbidden]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div
        className={
          forbidden
            ? 'flex size-12 items-center justify-center rounded-xl bg-warning-soft text-warning'
            : 'flex size-12 items-center justify-center rounded-xl bg-destructive-soft text-destructive'
        }
      >
        {forbidden ? (
          <Lock className="size-5" aria-hidden />
        ) : (
          <AlertTriangle className="size-5" aria-hidden />
        )}
      </div>

      <h1 className="mt-5 text-xl font-semibold tracking-[-0.02em]">
        {forbidden ? 'This area is for Adwuma360 staff' : 'Something went wrong'}
      </h1>
      <p className="mt-2 max-w-sm text-pretty text-[13.5px] leading-relaxed text-muted-foreground">
        {forbidden
          ? 'Your account does not operate the platform. Owning or administering a workspace is a different thing entirely, and grants nothing here.'
          : 'The console failed to load. Try again, and if it keeps happening the reference below will help track it down.'}
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button asChild>
          <Link href="/dashboard">Go to my workspace</Link>
        </Button>
        {forbidden ? null : (
          <Button variant="secondary" onClick={reset}>
            Try again
          </Button>
        )}
      </div>

      {!forbidden && error.digest ? (
        <code className="mt-4 rounded-md border border-border bg-surface-subtle px-2 py-1 font-mono text-[11.5px] text-muted-foreground">
          {error.digest}
        </code>
      ) : null}
    </div>
  );
}
