'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ShieldCheck, ShieldOff, UserRound, UserX } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { DataTable } from '@/components/data-table/data-table';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { RowActions, type RowAction } from '@/components/shared/row-actions';
import { formatDate } from '@/lib/date';
import { TimeAgo } from '@/components/shared/time-ago';
import { runAction } from '@/lib/client-action';
import type { PageInfo } from '@/lib/query';
import { setPlatformAdminAction, setUserActiveAction } from '@/server/actions/platform';
import type { PlatformUserRow } from '@/server/services/platform';

function identity(row: PlatformUserRow) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="truncate font-medium">{row.name}</span>
        {row.isPlatformAdmin ? (
          <Badge variant="brand" size="sm" className="gap-1">
            <ShieldCheck className="size-3" aria-hidden /> Staff
          </Badge>
        ) : null}
        {row.isActive ? null : (
          <Badge variant="destructive" size="sm">
            Disabled
          </Badge>
        )}
        {row.emailVerified ? null : (
          <Badge variant="warning" size="sm">
            Unconfirmed
          </Badge>
        )}
      </div>
      <p className="truncate text-[11.5px] text-muted-foreground">{row.email}</p>
    </div>
  );
}

export function PeopleTable({
  rows,
  pageInfo,
  currentUserId,
  isFiltered,
}: {
  rows: PlatformUserRow[];
  pageInfo: PageInfo;
  currentUserId: string;
  isFiltered: boolean;
}) {
  const router = useRouter();
  const [disabling, setDisabling] = React.useState<PlatformUserRow | null>(null);
  const [reason, setReason] = React.useState('');
  const [staffChange, setStaffChange] = React.useState<PlatformUserRow | null>(null);

  async function toggleStaff(row: PlatformUserRow) {
    const result = await runAction(() =>
      setPlatformAdminAction(row.id, !row.isPlatformAdmin),
    );
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(
      row.isPlatformAdmin
        ? `${row.name} no longer operates the platform`
        : `${row.name} can now open this console`,
    );
    setStaffChange(null);
    router.refresh();
  }

  /**
   * `why` is passed rather than read from state: enabling an account sets the
   * reason and calls this in the same handler, and a state update is not
   * visible until the next render, so the action would be sent the empty
   * string it started with and refused for having no reason.
   */
  async function setActive(row: PlatformUserRow, isActive: boolean, why: string) {
    const result = await runAction(() => setUserActiveAction(row.id, isActive, why));
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(isActive ? `${row.name} can sign in again` : `${row.name} is disabled`);
    setDisabling(null);
    setReason('');
    router.refresh();
  }

  function actionsFor(row: PlatformUserRow): RowAction[] {
    const isSelf = row.id === currentUserId;
    const actions: RowAction[] = [];

    if (!isSelf || !row.isPlatformAdmin) {
      actions.push({
        label: row.isPlatformAdmin ? 'Revoke operator access' : 'Grant operator access',
        icon: row.isPlatformAdmin ? ShieldOff : ShieldCheck,
        onSelect: () => setStaffChange(row),
      });
    }

    if (!isSelf) {
      actions.push({
        label: row.isActive ? 'Disable account' : 'Enable account',
        icon: UserX,
        destructive: row.isActive,
        separatorBefore: actions.length > 0,
        onSelect: () => {
          if (row.isActive) {
            setDisabling(row);
          } else {
            void setActive(row, true, 'Re-enabled from the operator console.');
          }
        },
      });
    }

    return actions;
  }

  return (
    <>
      <DataTable
        rows={rows}
        rowKey={(row) => row.id}
        pageInfo={pageInfo}
        isFiltered={isFiltered}
        searchPlaceholder="Search by name or email…"
        filters={[
          {
            key: 'access',
            label: 'Access',
            width: 'w-48',
            options: [
              { value: 'staff', label: 'Operates the platform' },
              { value: 'disabled', label: 'Disabled accounts' },
            ],
          },
        ]}
        columns={[
          { id: 'name', header: 'Person', cell: identity },
          {
            id: 'workspaces',
            header: 'Workspaces',
            hideBelow: 'md',
            cell: (row) =>
              row.workspaces.length === 0 ? (
                <span className="text-muted-foreground">None</span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {row.workspaces.slice(0, 3).map((workspace) => (
                    <Link
                      key={workspace.id}
                      href={`/admin/organizations/${workspace.id}`}
                      className="rounded-md border border-border px-1.5 py-0.5 text-[11.5px] hover:bg-muted"
                    >
                      {workspace.name} · {workspace.role}
                    </Link>
                  ))}
                  {row.workspaces.length > 3 ? (
                    <span className="text-[11.5px] text-muted-foreground">
                      +{row.workspaces.length - 3} more
                    </span>
                  ) : null}
                </div>
              ),
          },
          {
            id: 'lastLoginAt',
            header: 'Last seen',
            align: 'right',
            hideBelow: 'lg',
            cell: (row) =>
              row.lastLoginAt ? <TimeAgo value={row.lastLoginAt} /> : 'Never signed in',
          },
          {
            id: 'createdAt',
            header: 'Joined',
            align: 'right',
            hideBelow: 'sm',
            cell: (row) => <span className="tabular">{formatDate(row.createdAt)}</span>,
          },
          {
            id: 'actions',
            header: '',
            align: 'right',
            width: 'w-12',
            cell: (row) => (
              <RowActions actions={actionsFor(row)} label={`Actions for ${row.name}`} />
            ),
          },
        ]}
        mobileRow={(row) => (
          <div className="flex items-start justify-between gap-3">
            {identity(row)}
            <RowActions actions={actionsFor(row)} label={`Actions for ${row.name}`} />
          </div>
        )}
        empty={
          <EmptyState
            icon={UserRound}
            title="Nobody has signed up yet"
            description="Accounts appear here the moment someone creates a workspace."
          />
        }
      />

      <ConfirmDialog
        open={Boolean(staffChange)}
        onOpenChange={(next) => !next && setStaffChange(null)}
        title={
          staffChange?.isPlatformAdmin
            ? `Revoke ${staffChange?.name}'s operator access?`
            : `Let ${staffChange?.name ?? 'them'} operate the platform?`
        }
        description={
          staffChange?.isPlatformAdmin
            ? 'They lose this console. Their own workspaces are untouched.'
            : 'They get this console: every workspace, every plan, every account. It grants nothing inside anybody else’s workspace, and it is written to the operator log.'
        }
        confirmLabel={staffChange?.isPlatformAdmin ? 'Revoke' : 'Grant access'}
        destructive={staffChange?.isPlatformAdmin}
        onConfirm={() => (staffChange ? toggleStaff(staffChange) : undefined)}
      />

      <ConfirmDialog
        open={Boolean(disabling)}
        onOpenChange={(next) => {
          if (!next) {
            setDisabling(null);
            setReason('');
          }
        }}
        title={`Disable ${disabling?.name ?? 'this account'}?`}
        description={
          <div className="space-y-3">
            <p>
              They cannot sign in to any workspace until this is undone. Nothing they
              have created is removed, and their name stays on it.
            </p>
            <Textarea
              rows={3}
              autoFocus
              placeholder="Requested by the owner of their workspace."
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
        }
        confirmLabel="Disable"
        destructive
        onConfirm={() => (disabling ? setActive(disabling, false, reason) : undefined)}
      />
    </>
  );
}
