'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowRight, Check, CreditCard, Mail } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  PLANS,
  PLATFORM_CURRENCY,
  annualSaving,
  type BillingPeriod,
  type PlanId,
} from '@/lib/config/plans';
import { brand } from '@/lib/config/brand';
import { formatCurrency } from '@/lib/money';
import { cn } from '@/lib/utils';
import {
  cancelPlanRequestAction,
  requestPlanAction,
  startCheckoutAction,
} from '@/server/actions/billing';

/**
 * Plan selection for the workspace owner.
 *
 * Two routes out of the same set of buttons. A plan with a Paystack plan code
 * behind it opens a real checkout; anything else — Enterprise, or a plan not
 * set up in the dashboard yet — records the request and says so. The page never
 * offers a checkout it cannot complete, and never pretends a request is a
 * payment.
 *
 * `purchasable` decides which is which, and comes from the server: the
 * browser has no way to know whether a plan code is configured, and a button
 * that finds out by failing is exactly the dead control this product does not
 * ship.
 */
export function PlanChooser({
  currentPlan,
  requestedPlan,
  requestedPeriod,
  isOwner,
  purchasable,
  subscriptionStatus,
  renews,
}: {
  currentPlan: PlanId;
  requestedPlan: PlanId | null;
  requestedPeriod: BillingPeriod | null;
  isOwner: boolean;
  /** `plan:period` pairs that can be bought outright, e.g. `business:annual`. */
  purchasable: string[];
  subscriptionStatus: string;
  /** True while a live subscription will charge again on its own. */
  renews: boolean;
}) {
  const router = useRouter();
  // Open on the period they last asked for, so the prices on screen match the
  // request in the banner above them.
  const [annual, setAnnual] = React.useState(requestedPeriod !== 'monthly');
  const [pending, setPending] = React.useState<PlanId | null>(null);
  const [cancelling, setCancelling] = React.useState(false);

  const requested = PLANS.find((plan) => plan.id === requestedPlan);

  const period: BillingPeriod = annual ? 'annual' : 'monthly';

  function canBuy(planId: PlanId) {
    return purchasable.includes(`${planId}:${period}`);
  }

  const anythingPurchasable = PLANS.some((plan) => canBuy(plan.id));

  // Past the trial conversation: this workspace has been through a
  // subscription, so the heading should stop talking about what happens next.
  const hasPaid =
    subscriptionStatus === 'active' ||
    subscriptionStatus === 'past_due' ||
    subscriptionStatus === 'cancelled';

  async function choose(planId: PlanId, planName: string) {
    setPending(planId);

    if (canBuy(planId)) {
      const result = await startCheckoutAction({ plan: planId, period });

      if (!result.ok) {
        setPending(null);
        toast.error(result.error);
        return;
      }

      // Deliberately still pending. The browser is on its way to Paystack and
      // a button that springs back to life first invites a second checkout.
      window.location.assign(result.data.url);
      return;
    }

    const result = await requestPlanAction({ plan: planId, period });
    setPending(null);

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(`${planName} requested`, {
      description: `Recorded at the ${annual ? 'yearly' : 'monthly'} price. Nothing has been charged, and a confirmation is on its way to your inbox.`,
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
            {hasPaid ? 'Change your plan' : 'Choose what happens after the trial'}
          </h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {!isOwner
              ? 'Only the workspace owner can change the plan.'
              : anythingPurchasable
                ? 'Pay by card, mobile money or bank transfer. The subscription renews on its own and you can stop it whenever you like.'
                : 'Pick a plan and we will take it from there. You can change your mind until it is set up.'}
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
            <span className="font-medium">{requested.name}</span>
            {requestedPeriod
              ? `, billed ${requestedPeriod === 'annual' ? 'yearly' : 'monthly'},`
              : ''}{' '}
            is requested. Nothing has been charged, and we will be in touch to set it up.
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
          const buyable = canBuy(plan.id);
          // Already paying for this one, on this period, with a renewal to come.
          const isSubscribed =
            isCurrent && renews && (requestedPeriod === null || requestedPeriod === period);

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
                      {formatCurrency(price, { compact: false, currency: PLATFORM_CURRENCY }).replace(/\.00$/, '')}
                    </span>
                    <span className="text-[12.5px] text-muted-foreground">
                      {annual ? '/ year' : '/ month'}
                    </span>
                  </>
                )}
              </div>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                {price === null
                  ? 'Priced on your entity count'
                  : annual
                    ? (() => {
                        const percent = annualSaving(plan);
                        return percent === null
                          ? 'Billed once a year'
                          : `Billed once a year, ${percent}% less`;
                      })()
                    : 'Billed every month'}
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
                  variant={isSubscribed || (isRequested && !buyable) ? 'secondary' : 'default'}
                  disabled={
                    !isOwner ||
                    isSubscribed ||
                    (isRequested && !buyable) ||
                    pending !== null
                  }
                  loading={pending === plan.id}
                  onClick={() => choose(plan.id, plan.name)}
                >
                  {isSubscribed ? (
                    <>
                      <Check /> Your plan
                    </>
                  ) : buyable ? (
                    <>
                      <CreditCard />
                      {isCurrent && subscriptionStatus === 'past_due'
                        ? 'Pay now'
                        : `Subscribe to ${plan.name}`}
                    </>
                  ) : isRequested ? (
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

      {anythingPurchasable ? (
        <p className="text-center text-[12px] text-muted-foreground">
          Payments are taken by Paystack. Your card details are entered on their
          page and never reach {brand.name}.
        </p>
      ) : null}
    </section>
  );
}
