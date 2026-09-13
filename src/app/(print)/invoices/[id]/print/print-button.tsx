'use client';

import { ArrowLeft, Printer } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

/** Screen-only toolbar; hidden by the print stylesheet. */
export function PrintToolbar({ invoiceId }: { invoiceId: string }) {
  return (
    <div className="print:hidden sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[52rem] items-center justify-between gap-3 px-6 py-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/invoices/${invoiceId}`}>
            <ArrowLeft /> Back to invoice
          </Link>
        </Button>
        <p className="hidden text-[12.5px] text-muted-foreground sm:block">
          Use your browser&rsquo;s print dialog and choose &ldquo;Save as PDF&rdquo;.
        </p>
        <Button size="sm" onClick={() => window.print()}>
          <Printer /> Print
        </Button>
      </div>
    </div>
  );
}
