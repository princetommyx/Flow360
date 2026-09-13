import Link from 'next/link';
import { AlertTriangle, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/date';
import { trialState } from '@/lib/config/plans';
import { cn } from '@/lib/utils';

type Organization = { trialEndsAt: Date | string | null; subscriptionStatus: string };

function plural(days: number) {
  return days === 1 ? '1 day' : `${days} days`;
}

/**
 * Compact trial marker for the sidebar.
 *
 * It is present for the whole trial so the countdown is never a surprise, but
 * stays quiet until the last week — at which point it takes the warning tone
 * that the banner uses.
 */
export function TrialCard({
  organization,
  className,
}: {
  organization: Organization;
  className?: string;
}) {
  const trial = trialState(organization);
  if (trial.status === 'active' || trial.status === 'none') return null;

  const expired = trial.status === 'expired';

  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2.5',
        expired || trial.endingSoon
          ? 'border-warning/40 bg-warning-soft'
          : 'border-sidebar-border bg-sidebar-accent/40',
        className,
      )}
    >
      <p className="flex items-center gap-1.5 text-[12.5px] font-medium">
        {expired || trial.endingSoon ? (
          <AlertTriangle className="size-3.5 shrink-0 text-warning" aria-hidden />
        ) : (
          <Sparkles className="size-3.5 shrink-0 text-primary" aria-hidden />
        )}
        {expired ? 'Trial ended' : `${plural(trial.daysRemaining)} left`}
      </p>
      <p className="mt-1 text-[11.5px] leading-relaxed text-muted-foreground">
        {expired
          ? 'Choose a plan to keep your workspace.'
          : `Free trial ends ${formatDate(trial.endsAt!)}.`}
      </p>
      <Button asChild size="sm" variant="secondary" className="mt-2.5 w-full">
        <Link href="/settings/billing">{expired ? 'Choose a plan' : 'View plans'}</Link>
      </Button>
    </div>
  );
}
