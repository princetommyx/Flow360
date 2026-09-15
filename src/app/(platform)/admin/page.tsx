import type { Metadata } from 'next';
import Link from 'next/link';
import {
  AlarmClock,
  Building2,
  CircleDollarSign,
  Inbox,
  UserRound,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { RankedTable } from '@/components/reports/ranked-table';
import { ShareBar } from '@/components/reports/share-bar';
import { SignupTrendChart } from '@/components/charts/signup-trend-chart';
import { formatCurrency, formatNumber, formatRatio } from '@/lib/money';
import { formatDate, formatRelative } from '@/lib/date';
import { PLATFORM_CURRENCY } from '@/lib/config/plans';
import { hasBootstrapAdmins } from '@/lib/config/platform';
import { requirePlatformAdmin } from '@/server/platform';
import {
  getPlanBreakdown,
  getPlatformSummary,
  getSignupTrend,
  listPlanRequests,
  listPlatformAudit,
} from '@/server/services/platform';

export const metadata: Metadata = { title: 'Overview' };

export default async function PlatformOverviewPage() {
  await requirePlatformAdmin();

  const [summary, trend, plans, requests, audit] = await Promise.all([
    getPlatformSummary(),
    getSignupTrend(),
    getPlanBreakdown(),
    listPlanRequests(),
    listPlatformAudit({ limit: 8 }),
  ]);

  const money = (value: number) =>
    formatCurrency(value, { currency: PLATFORM_CURRENCY });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="How Adwuma360 itself is doing: who has signed up, who is still trialing and who is waiting on a decision."
      />

      {hasBootstrapAdmins() ? null : (
        <Card className="border-warning/30 bg-warning-soft p-4 text-[13px] leading-relaxed">
          Neither <code>PLATFORM_ADMIN_EMAILS</code> nor{' '}
          <code>PLATFORM_ADMIN_DOMAINS</code> is set. One of them is the way back
          in if the last operator flag is ever revoked, so it is worth setting one.
        </Card>
      )}

      <section aria-label="Headline figures" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Workspaces"
          value={formatNumber(summary.organizations)}
          icon={Building2}
          footer={
            <span className="text-[11.5px] text-muted-foreground">
              {formatNumber(summary.suspended)} suspended,{' '}
              {formatNumber(summary.people)} people in total
            </span>
          }
        />
        <StatCard
          label="New this month"
          value={formatNumber(summary.signupsThisMonth)}
          change={summary.signupChange}
          icon={UserRound}
          comparisonLabel="vs last month"
        />
        <StatCard
          label="On a paid plan"
          value={formatNumber(summary.subscribed)}
          icon={CircleDollarSign}
          footer={
            <span className="text-[11.5px] text-muted-foreground">
              {money(summary.committedMonthly)} a month committed
            </span>
          }
        />
        <StatCard
          label="Trials ending this week"
          value={formatNumber(summary.trialsEndingSoon)}
          icon={AlarmClock}
          footer={
            <span className="text-[11.5px] text-muted-foreground">
              {formatNumber(summary.trialsExpired)} already past their end date
            </span>
          }
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] [&>*]:min-w-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Sign-ups</CardTitle>
            <CardDescription>
              New workspaces a month at a time, over the last year.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignupTrendChart points={trend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Plans</CardTitle>
            <CardDescription>
              What every workspace is on, trials included.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RankedTable
              rows={plans}
              keyOf={(row) => row.plan}
              emptyTitle="No workspaces yet"
              columns={[
                {
                  header: 'Plan',
                  className: 'w-1/2',
                  cell: (row) => (
                    <div className="min-w-0 pr-4">
                      <p className="truncate">{row.label}</p>
                      <ShareBar share={row.share} className="mt-1.5" />
                    </div>
                  ),
                },
                { header: 'Share', numeric: true, cell: (row) => formatRatio(row.share) },
                {
                  header: 'Workspaces',
                  numeric: true,
                  cell: (row) => <span className="font-medium">{row.count}</span>,
                },
              ]}
            />

            <dl className="mt-5 grid grid-cols-2 gap-3 text-[12.5px]">
              {[
                { label: 'Trialing', value: summary.trialing },
                { label: 'Subscribed', value: summary.subscribed },
                { label: 'Past due', value: summary.pastDue },
                { label: 'Cancelled', value: summary.cancelled },
              ].map((item) => (
                <div key={item.label} className="rounded-lg border border-border px-3 py-2">
                  <dt className="text-muted-foreground">{item.label}</dt>
                  <dd className="tabular mt-0.5 text-[15px] font-semibold">
                    {formatNumber(item.value)}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-[14px]">Waiting on a decision</CardTitle>
              <CardDescription>
                Plan requests sitting in the queue. Nothing charges anyone, so
                each one needs a person.
              </CardDescription>
            </div>
            {requests.length > 0 ? (
              <Button variant="secondary" size="sm" asChild>
                <Link href="/admin/requests">
                  <Inbox /> Open queue
                </Link>
              </Button>
            ) : null}
          </CardHeader>
          <CardContent>
            <RankedTable
              rows={requests.slice(0, 6)}
              keyOf={(row) => row.organizationId}
              emptyTitle="Nothing waiting"
              emptyDescription="Plan requests raised from a workspace's billing page land here."
              columns={[
                {
                  header: 'Workspace',
                  cell: (row) => (
                    <Link
                      href={`/admin/organizations/${row.organizationId}`}
                      className="hover:underline"
                    >
                      {row.organizationName}
                    </Link>
                  ),
                },
                {
                  header: 'Wants',
                  cell: (row) => (
                    <Badge variant="info" size="sm">
                      {row.requestedPlanLabel} · {row.billing}
                    </Badge>
                  ),
                },
                {
                  header: 'Trial ends',
                  numeric: true,
                  cell: (row) =>
                    row.trialEndsAt ? formatDate(row.trialEndsAt) : 'No trial',
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="text-[14px]">Recent operator activity</CardTitle>
              <CardDescription>
                Everything this console has changed, newest first.
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/activity">See all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <RankedTable
              rows={audit}
              keyOf={(row) => row.id}
              emptyTitle="Nothing changed yet"
              emptyDescription="Approving a plan, extending a trial or granting access all leave a line here."
              columns={[
                {
                  header: 'What happened',
                  cell: (row) => (
                    <div className="min-w-0">
                      <p className="truncate">{row.summary}</p>
                      <p className="text-[11.5px] text-muted-foreground">
                        {row.actor} · {formatRelative(row.createdAt)}
                      </p>
                    </div>
                  ),
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
