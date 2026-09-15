'use client';

import * as React from 'react';
import Link from 'next/link';
import { AlertTriangle, Lock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FORBIDDEN_DIGEST } from '@/lib/forbidden';

/**
 * Failures inside the signed-in shell.
 *
 * Being refused by your role is not a fault, and reading "something went
 * wrong" when the answer is "your role does not cover this" sends people to
 * support over a setting a colleague can change in a minute.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const forbidden = error.digest === FORBIDDEN_DIGEST;

  React.useEffect(() => {
    if (!forbidden) console.error('Unhandled application error', error);
  }, [error, forbidden]);

  if (forbidden) {
    return (
      <div className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-xl bg-warning-soft text-warning">
          <Lock className="size-5" aria-hidden />
        </div>
        <h1 className="mt-5 text-xl font-semibold tracking-[-0.02em]">
          Your role does not cover this
        </h1>
        <p className="mt-2 max-w-sm text-pretty text-[13.5px] leading-relaxed text-muted-foreground">
          Nothing is broken. This part of the workspace is switched off for your role,
          and an owner or administrator can turn it on under roles and permissions.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button asChild>
            <Link href="/dashboard">Back to the dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl bg-destructive-soft text-destructive">
        <AlertTriangle className="size-5" aria-hidden />
      </div>
      <h1 className="mt-5 text-xl font-semibold tracking-[-0.02em]">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-sm text-pretty text-[13.5px] leading-relaxed text-muted-foreground">
        The page failed to load. Try again, and if it keeps happening the reference
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
