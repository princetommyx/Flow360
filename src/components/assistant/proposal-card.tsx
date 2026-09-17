'use client';

import * as React from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ArrowRight, Check, TriangleAlert, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { cancelProposalAction, confirmProposalAction } from '@/server/actions/assistant';
import type { ProposalPreview } from '@/server/assistant/context';

/**
 * A draft, and the button that makes it real.
 *
 * One card for every kind of draft — an invoice, a payslip, a customer — because
 * they all answer the same three questions: what is it, what will it come to,
 * and do you want it. A card per type would drift, and this is the screen where
 * drift means somebody agreeing to something they did not read.
 *
 * The figures are worked out on the server and arrive as text. Nothing here
 * computes a total, so what is agreed to is exactly what was staged.
 */

export type ProposalState = {
  id: string;
  preview: ProposalPreview;
  status: string;
  resultLabel: string | null;
  resultHref: string | null;
  error: string | null;
};

export function ProposalCard({
  proposal,
  onSettled,
}: {
  proposal: ProposalState;
  onSettled: (id: string, next: Partial<ProposalState>) => void;
}) {
  const [pending, setPending] = React.useState<'confirm' | 'cancel' | null>(null);
  const { preview } = proposal;

  const settled = proposal.status !== 'pending';

  async function confirm() {
    setPending('confirm');
    const result = await confirmProposalAction(proposal.id);
    setPending(null);

    if (!result.ok) {
      onSettled(proposal.id, { status: 'failed', error: result.error });
      toast.error(result.error);
      return;
    }

    onSettled(proposal.id, {
      status: 'confirmed',
      resultLabel: result.data.resultLabel,
      resultHref: result.data.resultHref,
      error: null,
    });
    toast.success(result.data.resultLabel ?? 'Done');
  }

  async function discard() {
    setPending('cancel');
    const result = await cancelProposalAction(proposal.id);
    setPending(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    onSettled(proposal.id, { status: 'cancelled' });
  }

  return (
    <Card
      className={cn(
        'overflow-hidden',
        proposal.status === 'pending' && 'border-primary/40 ring-1 ring-primary/15',
        proposal.status === 'cancelled' && 'opacity-60',
      )}
    >
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold tracking-[-0.01em]">{preview.title}</p>
          {preview.subtitle ? (
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">{preview.subtitle}</p>
          ) : null}
        </div>
        {proposal.status === 'confirmed' ? (
          <Badge variant="success" size="sm">
            Done
          </Badge>
        ) : proposal.status === 'cancelled' ? (
          <Badge variant="neutral" size="sm">
            Discarded
          </Badge>
        ) : proposal.status === 'failed' ? (
          <Badge variant="destructive" size="sm">
            Refused
          </Badge>
        ) : (
          <Badge size="sm">Draft</Badge>
        )}
      </div>

      <div className="space-y-3 px-4 py-3">
        {preview.lines && preview.lines.length > 0 ? (
          <ul className="divide-y divide-border/60 rounded-lg border border-border">
            {preview.lines.map((line, index) => (
              <li key={index} className="flex items-start justify-between gap-3 px-3 py-2">
                <span className="min-w-0">
                  <span className="block text-[13px]">{line.label}</span>
                  {line.detail ? (
                    <span className="block text-[11.5px] text-muted-foreground">{line.detail}</span>
                  ) : null}
                </span>
                <span className="tabular shrink-0 text-[13px] font-medium">{line.amount}</span>
              </li>
            ))}
          </ul>
        ) : null}

        <dl className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
          {preview.rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-3">
              <dt className="text-[12.5px] text-muted-foreground">{row.label}</dt>
              <dd className="tabular text-[12.5px] font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>

        {preview.total ? (
          <div className="flex items-baseline justify-between border-t border-border pt-3">
            <span className="text-[13px] font-medium">{preview.total.label}</span>
            <span className="tabular text-[16px] font-semibold">{preview.total.value}</span>
          </div>
        ) : null}

        {preview.warning && !settled ? (
          <p className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning-soft px-3 py-2 text-[12.5px] leading-relaxed">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-warning" aria-hidden />
            <span>{preview.warning}</span>
          </p>
        ) : null}

        {proposal.error ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive-soft/40 px-3 py-2 text-[12.5px] leading-relaxed">
            {proposal.error}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border bg-surface-subtle px-4 py-3">
        {proposal.status === 'confirmed' ? (
          proposal.resultHref ? (
            <Button asChild size="sm" variant="secondary">
              <Link href={proposal.resultHref}>
                {proposal.resultLabel ?? 'Open it'} <ArrowRight />
              </Link>
            </Button>
          ) : (
            <p className="text-[12.5px] text-muted-foreground">
              {proposal.resultLabel ?? 'Saved.'}
            </p>
          )
        ) : proposal.status === 'cancelled' ? (
          <p className="text-[12.5px] text-muted-foreground">
            Nothing was created. Ask again if you change your mind.
          </p>
        ) : (
          <>
            <Button size="sm" onClick={confirm} loading={pending === 'confirm'} disabled={pending !== null}>
              <Check /> {preview.confirmLabel}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={discard}
              loading={pending === 'cancel'}
              disabled={pending !== null}
            >
              <X /> Discard
            </Button>
            <span className="text-[11.5px] text-muted-foreground">Nothing exists until you press it.</span>
          </>
        )}
      </div>
    </Card>
  );
}
