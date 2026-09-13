'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/date';
import { TRIAL_DAYS, trialState } from '@/lib/config/plans';
import { cn } from '@/lib/utils';

type Organization = { trialEndsAt: Date | string | null; subscriptionStatus: string };

/**
 * Full-width notice above the page content.
 *
 * Deliberately absent for most of the trial: it appears in the final week and
 * once the trial has run out, so it still means something when it shows up.
 * It also stands down on the billing page itself, where it would only point
 * at the page the reader is already on.
 */
export function TrialBanner({ organization }: { organization: Organization }) {
  const pathname = usePathname();
  const trial = trialState(organization);

  if (pathname.startsWith('/settings/billing')) return null;
  if (trial.status === 'active' || trial.status === 'none') return null;
  if (trial.status === 'trialing' && !trial.endingSoon) return null;

  const expired = trial.status === 'expired';
  const days = trial.daysRemaining === 1 ? '1 day' : `${trial.daysRemaining} days`;

  return (
    <div
      role="status"
      className={cn(
        'mb-6 flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between',
        expired
          ? 'border-destructive/30 bg-destructive-soft'
          : 'border-warning/40 bg-warning-soft',
      )}
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle
          className={cn(
            'mt-0.5 size-4 shrink-0',
            expired ? 'text-destructive' : 'text-warning',
          )}
          aria-hidden
        />
        <div>
          <p className="text-[13.5px] font-medium">
            {expired
              ? `Your ${TRIAL_DAYS}-day free trial has ended`
              : `${days} left in your free trial`}
          </p>
          <p className="mt-0.5 text-pretty text-[12.5px] leading-relaxed text-muted-foreground">
            {expired
              ? 'Your records are all still here. Pick a plan to carry on working, or export everything from any list.'
              : `Pick a plan before ${formatDate(trial.endsAt)} and nothing about your workspace changes.`}
          </p>
        </div>
      </div>

      <Button asChild size="sm" className="shrink-0 self-start sm:self-auto">
        <Link href="/settings/billing">{expired ? 'Choose a plan' : 'See plans'}</Link>
      </Button>
    </div>
  );
}
