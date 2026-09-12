import Link from 'next/link';
import { Compass } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Logo } from '@/components/brand/logo';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Logo size={32} className="mb-10" />
      <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-surface-subtle text-muted-foreground">
        <Compass className="size-5" aria-hidden />
      </div>
      <p className="mt-5 text-[13px] font-semibold uppercase tracking-widest text-muted-foreground">
        404
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-[-0.025em]">
        We couldn&rsquo;t find that page
      </h1>
      <p className="mt-2 max-w-sm text-pretty text-[13.5px] leading-relaxed text-muted-foreground">
        The link may be out of date, or the record it pointed to has been removed.
      </p>
      <div className="mt-6 flex gap-2">
        <Button asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/">Back to site</Link>
        </Button>
      </div>
    </div>
  );
}
