'use client';

import Link from 'next/link';
import { Building2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/data-table/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatDate } from '@/lib/date';
import type { PageInfo } from '@/lib/query';
import type { OrganizationRow } from '@/server/services/platform';

/** How much of a trial is left, said the way an operator would say it. */
function trialLabel(row: OrganizationRow) {
  if (!row.trialEndsAt || row.trialDaysLeft === null) return 'No trial';
  // Days, not "ago": a whole-day figure is the same on both sides of
  // hydration, where a relative string computed from the clock is not.
  if (row.trialDaysLeft < 0) {
    const days = Math.abs(row.trialDaysLeft);
    return `Ended ${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  if (row.trialDaysLeft === 0) return 'Ends today';
  return `${row.trialDaysLeft} ${row.trialDaysLeft === 1 ? 'day' : 'days'} left`;
}

function identity(row: OrganizationRow) {
  return (
    <div className="min-w-0">
      <p className="truncate font-medium">{row.name}</p>
      <p className="truncate text-[11.5px] text-muted-foreground">
        {row.owner ? row.owner.email : 'No owner on record'}
      </p>
    </div>
  );
}

export function OrganizationsTable({
  rows,
  pageInfo,
  plans,
  isFiltered,
}: {
  rows: OrganizationRow[];
  pageInfo: PageInfo;
  plans: Array<{ value: string; label: string }>;
  isFiltered: boolean;
}) {
  return (
    <DataTable
      rows={rows}
      rowKey={(row) => row.id}
      rowHref={(row) => `/admin/organizations/${row.id}`}
      pageInfo={pageInfo}
      isFiltered={isFiltered}
      searchPlaceholder="Search by name, slug or email…"
      filters={[
        { key: 'plan', label: 'Plan', options: plans, width: 'w-40' },
        {
          key: 'status',
          label: 'Status',
          width: 'w-44',
          options: [
            { value: 'trialing', label: 'Trialing' },
            { value: 'active', label: 'Subscribed' },
            { value: 'past_due', label: 'Past due' },
            { value: 'cancelled', label: 'Cancelled' },
            { value: 'suspended', label: 'Suspended' },
          ],
        },
        {
          key: 'requested',
          label: 'Requests',
          width: 'w-48',
          options: [{ value: 'yes', label: 'Waiting on a decision' }],
        },
      ]}
      columns={[
        { id: 'name', header: 'Workspace', sortable: true, sortKey: 'name', cell: identity },
        {
          id: 'plan',
          header: 'Plan',
          sortable: true,
          sortKey: 'plan',
          cell: (row) => (
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant="neutral" size="sm">
                {row.planLabel}
              </Badge>
              {row.requestedPlan ? (
                <Badge variant="info" size="sm">
                  Wants {row.requestedPlan}
                </Badge>
              ) : null}
            </div>
          ),
        },
        {
          id: 'status',
          header: 'Status',
          cell: (row) =>
            row.isActive ? (
              <StatusBadge status={row.status} size="sm" />
            ) : (
              <Badge variant="destructive" size="sm">
                Suspended
              </Badge>
            ),
        },
        {
          id: 'trial',
          header: 'Trial',
          sortable: true,
          sortKey: 'trialEndsAt',
          hideBelow: 'lg',
          cell: (row) => (
            <span
              className={
                row.trialDaysLeft !== null && row.trialDaysLeft < 0
                  ? 'text-muted-foreground'
                  : undefined
              }
            >
              {trialLabel(row)}
            </span>
          ),
        },
        {
          id: 'members',
          header: 'People',
          align: 'right',
          hideBelow: 'md',
          cell: (row) => <span className="tabular">{row.members}</span>,
        },
        {
          id: 'createdAt',
          header: 'Signed up',
          sortable: true,
          sortKey: 'createdAt',
          align: 'right',
          hideBelow: 'sm',
          cell: (row) => <span className="tabular">{formatDate(row.createdAt)}</span>,
        },
      ]}
      mobileRow={(row) => (
        <div className="flex items-start justify-between gap-3">
          {identity(row)}
          <div className="shrink-0 text-right">
            <Badge variant="neutral" size="sm">
              {row.planLabel}
            </Badge>
            <p className="mt-1 text-[11.5px] text-muted-foreground">{trialLabel(row)}</p>
          </div>
        </div>
      )}
      empty={
        <EmptyState
          icon={Building2}
          title="No workspaces yet"
          description="The first company to sign up will appear here."
        />
      }
    />
  );
}
