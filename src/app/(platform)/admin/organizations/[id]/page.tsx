import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

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
import { DetailList } from '@/components/shared/detail-list';
import { StatusBadge } from '@/components/shared/status-badge';
import { RankedTable } from '@/components/reports/ranked-table';
import { formatDate, formatRelative } from '@/lib/date';
import { formatCurrency, formatNumber } from '@/lib/money';
import { PLANS } from '@/lib/config/plans';
import { requirePlatformAdmin } from '@/server/platform';
import {
  getOrganizationDetail,
  listBillingEvents,
  listPlatformAudit,
} from '@/server/services/platform';

import { WorkspaceActions } from './workspace-actions';

export const metadata: Metadata = { title: 'Workspace' };

/**
 * Paystack's event names, in English.
 *
 * Anything unrecognised is shown as it arrived rather than as "Other": an
 * event we have not seen before is exactly the one an operator needs to read
 * literally.
 */
function billingEventLabel(type: string): string {
  switch (type) {
    case 'charge.success':
      return 'Payment received';
    case 'subscription.create':
      return 'Subscription started';
    case 'invoice.payment_failed':
      return 'Renewal declined';
    case 'subscription.not_renew':
      return 'Renewal stopped';
    case 'subscription.disable':
      return 'Subscription ended';
    case 'invoice.create':
      return 'Renewal invoice raised';
    case 'refund.processed':
      return 'Refund processed';
    default:
      return type;
  }
}

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePlatformAdmin();

  const { id } = await params;
  const organization = await getOrganizationDetail(id);
  if (!organization) notFound();

  const [audit, billing] = await Promise.all([
    listPlatformAudit({ targetId: id, limit: 20 }),
    listBillingEvents(id),
  ]);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/admin/organizations">
          <ArrowLeft /> All workspaces
        </Link>
      </Button>

      <PageHeader
        title={organization.name}
        description={`${organization.country} · ${organization.currency} · signed up ${formatDate(organization.createdAt)}`}
        meta={
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="neutral" size="sm">
              {organization.planLabel}
            </Badge>
            {organization.isActive ? (
              <StatusBadge status={organization.status} size="sm" />
            ) : (
              <Badge variant="destructive" size="sm">
                Suspended
              </Badge>
            )}
            {organization.requestedPlan ? (
              <Badge variant="info" size="sm">
                Wants {organization.requestedPlan}
              </Badge>
            ) : null}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] [&>*]:min-w-0">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-[14px]">The account</CardTitle>
            </CardHeader>
            <CardContent>
              <DetailList
                items={[
                  { label: 'Slug', value: organization.slug },
                  { label: 'Industry', value: organization.industry ?? 'Not given' },
                  { label: 'Contact email', value: organization.email ?? 'Not given' },
                  { label: 'Phone', value: organization.phone ?? 'Not given' },
                  {
                    label: 'Owner',
                    value: organization.owner
                      ? `${organization.owner.name} (${organization.owner.email})`
                      : 'No owner on record',
                    full: true,
                  },
                  {
                    label: 'Trial ends',
                    value: organization.trialEndsAt
                      ? `${formatDate(organization.trialEndsAt)} (${
                          organization.trialDaysLeft !== null && organization.trialDaysLeft < 0
                            ? 'ended'
                            : `${organization.trialDaysLeft} days left`
                        })`
                      : 'No trial',
                  },
                  {
                    label: 'Last activity',
                    value: organization.lastActivityAt
                      ? formatRelative(organization.lastActivityAt)
                      : 'Nothing recorded yet',
                  },
                  {
                    label: 'Subscription',
                    value: organization.subscribed
                      ? organization.subscriptionEndsAt
                        ? `Renews ${formatDate(organization.subscriptionEndsAt)}`
                        : 'Renewing'
                      : organization.subscriptionEndsAt
                        ? `Not renewing, paid to ${formatDate(organization.subscriptionEndsAt)}`
                        : 'Never subscribed',
                  },
                  {
                    label: 'Paystack customer',
                    value: organization.paystackCustomer ?? 'None',
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[14px]">How much it holds</CardTitle>
              <CardDescription>
                Counts only. The console does not open a workspace&rsquo;s records, and
                there is no route from here that does.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {organization.volumes.map((volume) => (
                  <div
                    key={volume.label}
                    className="rounded-lg border border-border px-3 py-2.5"
                  >
                    <dt className="text-[11.5px] text-muted-foreground">
                      {volume.label}
                    </dt>
                    <dd className="tabular mt-0.5 text-[16px] font-semibold">
                      {formatNumber(volume.count)}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[14px]">
                People ({organization.people.length})
              </CardTitle>
              <CardDescription>
                Who can sign in, and what their role in this workspace is. Roles are
                changed from inside the workspace, not from here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RankedTable
                rows={organization.people}
                keyOf={(row) => row.id}
                emptyTitle="Nobody in this workspace"
                columns={[
                  {
                    header: 'Name',
                    cell: (row) => (
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="truncate">{row.name}</span>
                          {row.isOwner ? (
                            <Badge variant="brand" size="sm">
                              Owner
                            </Badge>
                          ) : null}
                          {row.status === 'ACTIVE' ? null : (
                            <StatusBadge status={row.status} size="sm" />
                          )}
                        </div>
                        <p className="truncate text-[11.5px] text-muted-foreground">
                          {row.email}
                        </p>
                      </div>
                    ),
                  },
                  { header: 'Role', cell: (row) => row.role },
                  {
                    header: 'Last seen',
                    numeric: true,
                    cell: (row) =>
                      row.lastLoginAt ? formatRelative(row.lastLoginAt) : 'Never',
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[14px]">What we have charged</CardTitle>
              <CardDescription>
                Every event the payment provider has sent about this workspace, as it
                arrived. Failures included — a decline is the thing somebody writes in
                about.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RankedTable
                rows={billing}
                keyOf={(row) => row.id}
                emptyTitle="No payments yet"
                emptyDescription="This workspace has never been charged. A checkout, a renewal or a decline would each leave a line."
                columns={[
                  {
                    header: 'Event',
                    cell: (row) => (
                      <div className="min-w-0">
                        <p className="truncate">{billingEventLabel(row.type)}</p>
                        <p className="truncate font-mono text-[11px] text-muted-foreground">
                          {row.reference}
                        </p>
                      </div>
                    ),
                  },
                  {
                    header: 'Plan',
                    cell: (row) =>
                      row.planLabel
                        ? `${row.planLabel}${row.period === 'annual' ? ' · yearly' : row.period === 'monthly' ? ' · monthly' : ''}`
                        : '—',
                  },
                  {
                    header: 'Amount',
                    numeric: true,
                    cell: (row) =>
                      row.amount > 0
                        ? formatCurrency(row.amount, { currency: row.currency })
                        : '—',
                  },
                  {
                    header: 'When',
                    numeric: true,
                    cell: (row) => formatRelative(row.occurredAt),
                  },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-[14px]">What we have changed</CardTitle>
              <CardDescription>
                Operator actions on this workspace. Nothing removes a line from here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RankedTable
                rows={audit}
                keyOf={(row) => row.id}
                emptyTitle="Nothing yet"
                emptyDescription="Approving a plan, extending a trial or suspending this workspace would each leave a line."
                columns={[
                  {
                    header: 'Action',
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

        <WorkspaceActions
          organizationId={organization.id}
          name={organization.name}
          plan={organization.plan}
          billing={organization.requestedBilling === 'annual' ? 'annual' : 'monthly'}
          requestedPlan={organization.requestedPlan}
          isActive={organization.isActive}
          plans={PLANS.map((plan) => ({ value: plan.id, label: plan.name }))}
        />
      </div>
    </div>
  );
}
