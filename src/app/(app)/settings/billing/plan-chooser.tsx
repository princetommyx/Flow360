'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowRight, Check, Mail } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PLANS, type PlanId } from '@/lib/config/plans';
import { brand } from '@/lib/config/brand';
import { formatCurrency } from '@/lib/money';
import { cn } from '@/lib/utils';
import { cancelPlanRequestAction, requestPlanAction } from '@/server/actions/billing';

/**
 * Plan selection for the workspace owner.
 *
 * There is no checkout to send anyone to yet, so the button does the honest
 * thing: it records the request, says so, and can be undone.
 */
export function PlanChooser({
  currentPlan,
  requestedPlan,
  isOwner,
}: {
  currentPlan: PlanId;
  requestedPlan: PlanId | null;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [annual, setAnnual] = React.useState(true);
  const [pending, setPending] = React.useState<PlanId | null>(null);
  const [cancelling, setCancelling] = React.useState(false);

  const requested = PLANS.find((plan) => plan.id === requestedPlan);

  async function choose(planId: PlanId, planName: string) {
    setPending(planId);
    const result = await requestPlanAction({ plan: planId });
    setPending(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(`${planName} requested`, {
      description: 'Recorded — nothing has been charged. We will be in touch to set it up.',
    });
    router.refresh();
  }

  async function withdraw() {
    setCancelling(true);
    const result = await cancelPlanRequestAction();
    setCancelling(false);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success('Plan request withdrawn');
    router.refresh();
  }

  return (
    <section aria-labelledby="plans-heading" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="plans-heading" className="text-[15px] font-semibold tracking-[-0.01em]">
            Choose what happens after the trial
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {isOwner
              ? 'Pick a plan and we will take it from there. You can change your mind until it is set up.'
              : 'Only the workspace owner can change the plan.'}
          </p>
        </div>

        <div
          role="radiogroup"
          aria-label="Billing period"
          className="inline-flex items-center rounded-full border border-border bg-muted/60 p-1"
        >
          {[
            { id: 'monthly', label: 'Monthly' },
            { id: 'annual', label: 'Annual' },
          ].map((option) => {
            const selected = (option.id === 'annual') === annual;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setAnnual(option.id === 'annual')}
                className={cn(
                  'rounded-full px-3.5 py-1 text-[12.5px] font-medium transition-colors',
                  selected
                    ? 'bg-surface text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {requested ? (
        <Card className="flex flex-col gap-3 border-primary/30 bg-primary-soft/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] leading-relaxed">
            <span className="font-medium">{requested.name}</span> is requested. Nothing
            has been charged — we will be in touch to set it up.
          </p>
          {isOwner ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={withdraw}
              loading={cancelling}
              className="shrink-0 self-start sm:self-auto"
            >
              Withdraw request
            </Button>
          ) : null}
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        {PLANS.map((plan) => {
          const price = annual ? plan.annual : plan.monthly;
          const isCurrent = plan.id === currentPlan;
          const isRequested = plan.id === requestedPlan;

          return (
            <Card
              key={plan.id}
              className={cn(
                'flex flex-col p-5',
                isRequested && 'border-primary/40 ring-1 ring-primary/20',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[14px] font-semibold">{plan.name}</h3>
                {isCurrent ? (
                  <Badge variant="neutral" size="sm">
                    Current
                  </Badge>
                ) : isRequested ? (
                  <Badge size="sm">Requested</Badge>
                ) : null}
              </div>

              <div className="mt-3 flex items-baseline gap-1.5">
                {price === null ? (
                  <span className="text-[1.35rem] font-semibold tracking-[-0.02em]">
                    Let&rsquo;s talk
                  </span>
                ) : (
                  <>
                    <span className="text-[1.6rem] font-semibold tracking-[-0.025em] tabular">
                      {formatCurrency(price, { compact: false }).replace(/\.00$/, '')}
                    </span>
                    <span className="text-[12.5px] text-muted-foreground">/ month</span>
                  </>
                )}
              </div>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {price === null
                  ? 'Priced on your entity count'
                  : annual
                    ? 'Billed annually'
                    : 'Billed monthly'}
              </p>

              {plan.monthly === null ? (
                <Button asChild variant="secondary" className="mt-4 w-full">
                  <a
                    href={`mailto:${brand.supportEmail}?subject=${encodeURIComponent(
                      `${brand.name} Enterprise enquiry`,
                    )}`}
                  >
                    <Mail /> Email us
                  </a>
                </Button>
              ) : (
                <Button
                  className="mt-4 w-full"
                  variant={isRequested ? 'secondary' : 'default'}
                  disabled={!isOwner || isRequested || pending !== null}
                  loading={pending === plan.id}
                  onClick={() => choose(plan.id, plan.name)}
                >
                  {isRequested ? (
                    <>
                      <Check /> Requested
                    </>
                  ) : (
                    <>
                      Choose {plan.name} <ArrowRight />
                    </>
                  )}
                </Button>
              )}

              <ul className="mt-4 space-y-2 border-t border-border pt-4">
                <li className="text-[11.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {plan.seats}
                </li>
                {plan.includes.slice(0, 5).map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-[12.5px]">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
                    <span className="leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
