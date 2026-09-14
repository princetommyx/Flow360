import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarClock, Check, Download, ShieldCheck } from 'lucide-react';

import { PageHeader } from '@/components/shared/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { db } from '@/lib/db';
import { formatDate } from '@/lib/date';
import { PLANS, TRIAL_DAYS, findPlan, trialState } from '@/lib/config/plans';
import { brand } from '@/lib/config/brand';
import { requirePermission } from '@/server/tenant';

import { PlanChooser } from './plan-chooser';

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
      createdAt: true,
    },
  });

  const trial = trialState(organization);
  const current = findPlan(organization.plan) ?? PLANS[1];
  const requested = findPlan(organization.requestedPlan);

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
          trial.status === 'trialing' ? (
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
            {trial.status === 'trialing' || trial.status === 'expired' ? (
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

        <Card>
          <CardHeader>
            <CardTitle>Nothing is charged yet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-[13px] leading-relaxed text-muted-foreground">
            <p className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              <span>
                No card is stored against this workspace, so no payment can be taken.
                Choosing a plan below records the request and we follow up by email.
              </span>
            </p>
            <p className="flex items-start gap-2">
              <Download className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
              <span>
                Your data stays yours either way — every list and report exports to
                CSV, and invoices print to PDF.
              </span>
            </p>
            <p className="border-t border-border pt-3">
              Workspace opened {formatDate(organization.createdAt)}. Questions about
              billing go to{' '}
              <a
                href={`mailto:${brand.supportEmail}`}
                className="font-medium text-primary hover:underline"
              >
                {brand.supportEmail}
              </a>
              .
            </p>
          </CardContent>
        </Card>
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
