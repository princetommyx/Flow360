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
import { formatNumber } from '@/lib/money';
import { PLANS } from '@/lib/config/plans';
import { requirePlatformAdmin } from '@/server/platform';
import { getOrganizationDetail, listPlatformAudit } from '@/server/services/platform';

import { WorkspaceActions } from './workspace-actions';

export const metadata: Metadata = { title: 'Workspace' };

export default async function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePlatformAdmin();

  const { id } = await params;
  const organization = await getOrganizationDetail(id);
  if (!organization) notFound();

  const audit = await listPlatformAudit({ targetId: id, limit: 20 });

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
