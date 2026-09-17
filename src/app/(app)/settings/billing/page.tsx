import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarClock, Check } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { db } from '@/lib/db';
import { formatDate } from '@/lib/date';
import {
  BILLING_PERIODS,
  PLANS,
  TRIAL_DAYS,
  findPlan,
  trialState,
} from '@/lib/config/plans';
import { isPurchasable, paystackEnabled } from '@/lib/config/paystack';
import { brand } from '@/lib/config/brand';
import { requirePermission } from '@/server/tenant';

import { PlanChooser } from './plan-chooser';
import { SubscriptionCard } from './subscription-card';

export const metadata: Metadata = { title: 'Plan & billing' };

export default async function BillingPage() {
  const context = await requirePermission('settings.view');

  const organization = await db.organization.findUniqueOrThrow({
    where: { id: context.organization.id },
    select: {
      plan: true,
      trialEndsAt: true,
      subscriptionStatus: true,
      requestedPlan: true,
      requestedBilling: true,
      subscriptionEndsAt: true,
      paystackSubscription: true,
      createdAt: true,
    },
  });

  const trial = trialState(organization);
  const current = findPlan(organization.plan) ?? PLANS[1];
  const requested = findPlan(organization.requestedPlan);

  /*
    Which plan-and-period pairs can actually be bought, worked out here because
    it depends on server-only configuration: a Paystack secret key and a plan
    code per pair. Sent over as flat `plan:period` strings so the client
    component receives plain values and not a shape it has to trust.
  */
  const purchasable = PLANS.flatMap((plan) =>
    BILLING_PERIODS.filter((period) => isPurchasable(plan.id, period)).map(
      (period) => `${plan.id}:${period}`,
    ),
  );

  // A subscription that will charge again, as opposed to one that has been
  // cancelled and is running out its paid period.
  const hasSubscription = organization.paystackSubscription !== null;
  const renews = organization.subscriptionStatus === 'active' && hasSubscription;

  // Whether the period they have paid for is still running, decided here
  // against the server's clock rather than the reader's.
  const periodEndsInFuture =
    organization.subscriptionEndsAt !== null &&
    organization.subscriptionEndsAt > new Date();

  /*
    The trial bar is for workspaces that have never paid. Once one has, the
    trial date is just a leftover, and a progress bar counting down a trial
    underneath a live subscription reads as a threat rather than information.
  */
  const showTrial =
    organization.subscriptionEndsAt === null &&
    (trial.status === 'trialing' || trial.status === 'expired');

  // How much of the trial has been used, for the bar. Clamped so a workspace
  // created before the trial fields existed cannot push it past full.
  const elapsed = Math.min(
    100,
    Math.max(0, ((TRIAL_DAYS - trial.daysRemaining) / TRIAL_DAYS) * 100),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Plan & billing"
        description={`What ${context.organization.name} is on today, and what it would cost to carry on.`}
        meta={
          /*
            The subscription has the last word. A workspace whose renewal was
            declined still has a trial date on it somewhere, and "Trial · 18
            days left" is the wrong thing to tell somebody whose card has just
            been refused.
          */
          organization.subscriptionStatus === 'past_due' ? (
            <Badge variant="warning">Payment failed</Badge>
          ) : organization.subscriptionStatus === 'cancelled' ? (
            <Badge variant="neutral">Cancelled</Badge>
          ) : trial.status === 'trialing' ? (
            <Badge variant={trial.endingSoon ? 'warning' : 'default'}>
              Trial · {trial.daysRemaining} {trial.daysRemaining === 1 ? 'day' : 'days'} left
            </Badge>
          ) : trial.status === 'expired' ? (
            <Badge variant="destructive">Trial ended</Badge>
          ) : (
            <Badge variant="success">Active</Badge>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>{current.name} plan</CardTitle>
              <p className="mt-1 text-[13px] text-muted-foreground">{current.tagline}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {showTrial ? (
              <div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <CalendarClock className="size-3.5" aria-hidden />
                    {trial.status === 'expired'
                      ? `Trial ended ${formatDate(trial.endsAt)}`
                      : `Trial ends ${formatDate(trial.endsAt)}`}
                  </span>
                  <span className="tabular font-medium">
                    {trial.status === 'expired'
                      ? `${TRIAL_DAYS} of ${TRIAL_DAYS} days`
                      : `${TRIAL_DAYS - trial.daysRemaining} of ${TRIAL_DAYS} days`}
                  </span>
                </div>
                <Progress
                  value={trial.status === 'expired' ? 100 : elapsed}
                  className="mt-2"
                />
              </div>
            ) : null}

            <dl className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Users', value: current.limits.users },
                { label: 'Invoices', value: current.limits.invoices },
                { label: 'Companies', value: current.limits.companies },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-border p-3">
                  <dt className="text-[12px] uppercase tracking-wider text-muted-foreground">
                    {item.label}
                  </dt>
                  <dd className="mt-1 text-[13.5px] font-medium">{item.value}</dd>
                </div>
              ))}
            </dl>

            <ul className="grid gap-2 sm:grid-cols-2">
              {current.includes.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-[13px]">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
                  <span className="leading-relaxed">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <SubscriptionCard
          status={organization.subscriptionStatus}
          renews={renews}
          hasSubscription={hasSubscription}
          periodEndLabel={
            organization.subscriptionEndsAt
              ? formatDate(organization.subscriptionEndsAt)
              : null
          }
          periodEndsInFuture={periodEndsInFuture}
          openedAtLabel={formatDate(organization.createdAt)}
          supportEmail={brand.supportEmail}
          isOwner={context.membership.isOwner}
          payable={paystackEnabled()}
        />
      </div>

      <PlanChooser
        currentPlan={current.id}
        requestedPlan={requested?.id ?? null}
        requestedPeriod={
          organization.requestedBilling === 'monthly' ||
          organization.requestedBilling === 'annual'
            ? organization.requestedBilling
            : null
        }
        isOwner={context.membership.isOwner}
        purchasable={purchasable}
        subscriptionStatus={organization.subscriptionStatus}
        renews={renews}
      />

      <p className="text-center text-[12.5px] text-muted-foreground">
        Full plan comparison and pricing questions are on the{' '}
        <Link href="/pricing" className="font-medium text-primary hover:underline">
          pricing page
        </Link>
        .
      </p>
    </div>
  );
}
