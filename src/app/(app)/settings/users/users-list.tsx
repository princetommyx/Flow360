'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Mail, Plus, ShieldOff, ShieldCheck, UserMinus } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { RowActions, type RowAction } from '@/components/shared/row-actions';
import { StatusBadge } from '@/components/shared/status-badge';
import { formatDate } from '@/lib/date';
import { initials } from '@/lib/utils';
import { runAction } from '@/lib/client-action';
import {
  removeMemberAction,
  resendInviteAction,
  setMemberStatusAction,
  updateMemberRoleAction,
} from '@/server/actions/settings';
import type { MemberRow } from '@/server/services/settings';

import { InviteDialog, type RoleOption } from './invite-dialog';

export function UsersList({
  members,
  roles,
  currentUserId,
  canInvite,
  canEdit,
  canRemove,
  emailIsLive,
}: {
  members: MemberRow[];
  roles: RoleOption[];
  currentUserId: string;
  canInvite: boolean;
  canEdit: boolean;
  canRemove: boolean;
  emailIsLive: boolean;
}) {
  const router = useRouter();
  const [inviting, setInviting] = React.useState(false);
  const [removing, setRemoving] = React.useState<MemberRow | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);

  async function changeRole(member: MemberRow, roleId: string) {
    if (roleId === member.roleId) return;
    setPendingId(member.id);

    const result = await runAction(() =>
      updateMemberRoleAction({ memberId: member.id, roleId }),
    );
    setPendingId(null);

    if (!result.ok) {
      toast.error(result.error);
      // The select is showing a role the server did not accept, so put the
      // real one back rather than leaving a lie on screen.
      router.refresh();
      return;
    }

    toast.success(`${member.name} is now ${roles.find((r) => r.id === roleId)?.name}`);
    router.refresh();
  }

  async function setStatus(member: MemberRow, status: 'ACTIVE' | 'SUSPENDED') {
    const result = await runAction(() => setMemberStatusAction(member.id, status));

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(
      status === 'ACTIVE'
        ? `${member.name} has their access back`
        : `${member.name} is suspended`,
    );
    router.refresh();
  }

  async function resend(member: MemberRow) {
    const result = await runAction(() => resendInviteAction(member.id));

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast[result.data.emailed ? 'success' : 'warning'](
      result.data.emailed
        ? `Invitation sent again to ${member.email}`
        : 'The invitation was renewed, but the email did not go out.',
    );
  }

  async function remove() {
    if (!removing) return;
    const result = await runAction(() => removeMemberAction(removing.id));

    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success(`${removing.name} no longer has access`);
    setRemoving(null);
    router.refresh();
  }

  function actionsFor(member: MemberRow): RowAction[] {
    const isSelf = member.userId === currentUserId;
    const locked = member.isOwner || isSelf;
    const actions: RowAction[] = [];

    if (canInvite && member.status === 'INVITED') {
      actions.push({
        label: 'Send the invitation again',
        icon: Mail,
        onSelect: () => void resend(member),
      });
    }

    if (canEdit && !locked) {
      actions.push(
        member.status === 'SUSPENDED'
          ? {
              label: 'Restore access',
              icon: ShieldCheck,
              onSelect: () => void setStatus(member, 'ACTIVE'),
            }
          : {
              label: 'Suspend access',
              icon: ShieldOff,
              onSelect: () => void setStatus(member, 'SUSPENDED'),
            },
      );
    }

    if (canRemove && !locked) {
      actions.push({
        label: 'Remove from workspace',
        icon: UserMinus,
        destructive: true,
        separatorBefore: actions.length > 0,
        onSelect: () => setRemoving(member),
      });
    }

    return actions;
  }

  function subtitle(member: MemberRow) {
    if (member.status === 'INVITED') {
      return member.invitedAt ? `Invited ${formatDate(member.invitedAt)}` : 'Invited';
    }
    if (member.lastLoginAt) return `Last seen ${formatDate(member.lastLoginAt)}`;
    if (member.joinedAt) return `Joined ${formatDate(member.joinedAt)}`;
    return 'Has not signed in yet';
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-[14px]">
            {members.length} {members.length === 1 ? 'person' : 'people'}
          </CardTitle>
          <CardDescription>
            Removing someone keeps their name on the records they created and takes away
            the access.
          </CardDescription>
        </div>
        {canInvite ? (
          <Button size="sm" onClick={() => setInviting(true)}>
            <Plus /> Invite
          </Button>
        ) : null}
      </CardHeader>

      <CardContent>
        <ul className="divide-y divide-border rounded-lg border border-border">
          {members.map((member) => {
            const isSelf = member.userId === currentUserId;
            const actions = actionsFor(member);

            return (
              <li
                key={member.id}
                className="flex flex-wrap items-center gap-4 px-4 py-3.5"
              >
                <Avatar className="size-9 shrink-0">
                  <AvatarFallback>{initials(member.name)}</AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[13px] font-medium">
                      {member.name}
                    </span>
                    {member.isOwner ? (
                      <Badge variant="brand" size="sm">
                        Owner
                      </Badge>
                    ) : null}
                    {isSelf ? (
                      <Badge variant="outline" size="sm">
                        You
                      </Badge>
                    ) : null}
                    {member.status === 'ACTIVE' ? null : (
                      <StatusBadge status={member.status} size="sm" />
                    )}
                  </div>
                  <p className="truncate text-[12.5px] text-muted-foreground">
                    {member.email}
                    {member.jobTitle ? ` · ${member.jobTitle}` : ''}
                  </p>
                  <p className="text-[12px] text-muted-foreground/80">
                    {subtitle(member)}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  {canEdit && !member.isOwner && !isSelf ? (
                    <Select
                      value={member.roleId}
                      disabled={pendingId === member.id}
                      onValueChange={(value) => void changeRole(member, value)}
                    >
                      <SelectTrigger size="sm" className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={role.id}>
                            {role.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="w-40 text-right text-[13px] text-muted-foreground">
                      {member.roleName}
                    </span>
                  )}

                  {actions.length > 0 ? (
                    <RowActions actions={actions} label={`Actions for ${member.name}`} />
                  ) : (
                    <span className="size-8" aria-hidden />
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>

      {inviting ? (
        <InviteDialog
          roles={roles}
          open={inviting}
          onOpenChange={setInviting}
          emailIsLive={emailIsLive}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(removing)}
        onOpenChange={(next) => !next && setRemoving(null)}
        title={`Remove ${removing?.name ?? 'this person'}?`}
        description="They lose access to this workspace straight away. Their name stays on the invoices, payslips and records they created, and you can invite them back later."
        confirmLabel="Remove"
        destructive
        onConfirm={remove}
      />
    </Card>
  );
}
