'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CalendarPlus, Check, Power, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { runAction } from '@/lib/client-action';
import type { ActionResult } from '@/server/actions/types';
import {
  declinePlanRequestAction,
  extendTrialAction,
  setOrganizationActiveAction,
  setOrganizationPlanAction,
} from '@/server/actions/platform';

/**
 * Everything the console can change about one workspace.
 *
 * Kept in a single column beside the record rather than behind a menu: these
 * are decisions with consequences for someone else's business, and they should
 * be visible and deliberate rather than tucked away.
 */
export function WorkspaceActions({
  organizationId,
  name,
  plan,
  billing,
  requestedPlan,
  isActive,
  plans,
}: {
  organizationId: string;
  name: string;
  plan: string;
  billing: 'monthly' | 'annual';
  requestedPlan: string | null;
  isActive: boolean;
  plans: Array<{ value: string; label: string }>;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState<string | null>(null);

  const [nextPlan, setNextPlan] = React.useState(requestedPlan ?? plan);
  const [nextBilling, setNextBilling] = React.useState<'monthly' | 'annual'>(billing);
  const [planNote, setPlanNote] = React.useState('');

  const [days, setDays] = React.useState(14);

  const [declining, setDeclining] = React.useState(false);
  const [declineReason, setDeclineReason] = React.useState('');

  const [togglingAccess, setTogglingAccess] = React.useState(false);
  const [accessReason, setAccessReason] = React.useState('');

  async function run(key: string, call: () => Promise<ActionResult<unknown>>) {
    setPending(key);
    const result = await runAction(call);
    setPending(null);

    if (!result.ok) {
      toast.error(result.error);
      return false;
    }

    router.refresh();
    return true;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-[14px]">Plan</CardTitle>
          <CardDescription>
            {requestedPlan
              ? `${name} has asked to move to ${requestedPlan}. Applying it here charges nobody and does not touch a Paystack subscription — it is a decision and a record of it.`
              : 'Set the plan this workspace is on. It charges nobody and leaves any Paystack subscription exactly as it is.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="plan">Plan</Label>
            <Select value={nextPlan} onValueChange={setNextPlan}>
              <SelectTrigger id="plan">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {plans.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="billing">Billing</Label>
            <Select
              value={nextBilling}
              onValueChange={(value) => setNextBilling(value as 'monthly' | 'annual')}
            >
              <SelectTrigger id="billing">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="annual">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="plan-note">Note</Label>
            <Textarea
              id="plan-note"
              rows={2}
              placeholder="Anything the next person should know about this decision."
              value={planNote}
              onChange={(event) => setPlanNote(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              loading={pending === 'plan'}
              onClick={async () => {
                const ok = await run('plan', () =>
                  setOrganizationPlanAction(organizationId, {
                    plan: nextPlan,
                    billing: nextBilling,
                    note: planNote,
                  }),
                );
                if (ok) {
                  setPlanNote('');
                  toast.success(`${name} is on ${nextPlan}`);
                }
              }}
            >
              <Check /> {requestedPlan ? 'Approve and apply' : 'Apply plan'}
            </Button>

            {requestedPlan ? (
              <Button variant="secondary" size="sm" onClick={() => setDeclining(true)}>
                <X /> Decline
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[14px]">Trial</CardTitle>
          <CardDescription>
            Counted from today when the trial has already ended, so an extension is
            always the full number of days.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="days">Extend by</Label>
            <div className="flex items-center gap-2">
              <Input
                id="days"
                type="number"
                min={1}
                max={90}
                inputMode="numeric"
                value={String(days)}
                onChange={(event) => setDays(Number(event.target.value))}
                className="w-24"
              />
              <span className="text-[13px] text-muted-foreground">days</span>
            </div>
          </div>

          <Button
            variant="secondary"
            size="sm"
            loading={pending === 'trial'}
            onClick={async () => {
              const ok = await run('trial', () =>
                extendTrialAction(organizationId, { days, note: '' }),
              );
              if (ok) toast.success(`${name}'s trial extended by ${days} days`);
            }}
          >
            <CalendarPlus /> Extend trial
          </Button>
        </CardContent>
      </Card>

      <Card className={isActive ? undefined : 'border-destructive/30'}>
        <CardHeader>
          <CardTitle className="text-[14px]">Access</CardTitle>
          <CardDescription>
            {isActive
              ? 'Suspending takes away sign-in for everyone in this workspace. Not one row of their data is touched, so restoring puts everything back exactly as it was.'
              : 'This workspace is suspended. Nobody in it can sign in, and none of their data has been changed.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant={isActive ? 'destructive' : 'default'}
            size="sm"
            onClick={() => setTogglingAccess(true)}
          >
            <Power /> {isActive ? 'Suspend workspace' : 'Restore access'}
          </Button>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={declining}
        onOpenChange={(next) => {
          setDeclining(next);
          if (!next) setDeclineReason('');
        }}
        title={`Decline ${name}'s request?`}
        description={
          <div className="space-y-3">
            <p>
              They stay on {plan}. What you write here is sent to them and kept on the
              record.
            </p>
            <Textarea
              rows={3}
              autoFocus
              placeholder="We have not been able to take payment yet, so the trial has been extended instead."
              value={declineReason}
              onChange={(event) => setDeclineReason(event.target.value)}
            />
          </div>
        }
        confirmLabel="Decline request"
        destructive
        onConfirm={async () => {
          const ok = await run('decline', () =>
            declinePlanRequestAction(organizationId, declineReason),
          );
          if (ok) {
            setDeclineReason('');
            toast.success('Request declined and the workspace told');
          }
        }}
      />

      <ConfirmDialog
        open={togglingAccess}
        onOpenChange={(next) => {
          setTogglingAccess(next);
          if (!next) setAccessReason('');
        }}
        title={isActive ? `Suspend ${name}?` : `Restore ${name}?`}
        description={
          <div className="space-y-3">
            <p>
              {isActive
                ? 'Everyone in this workspace is signed out and cannot get back in until it is restored.'
                : 'Everyone in this workspace can sign in again and will find it as they left it.'}{' '}
              The reason is kept on the operator log.
            </p>
            <Textarea
              rows={3}
              autoFocus
              placeholder={
                isActive
                  ? 'Reported for abuse by three of their own customers.'
                  : 'Resolved with the owner on the phone this morning.'
              }
              value={accessReason}
              onChange={(event) => setAccessReason(event.target.value)}
            />
          </div>
        }
        confirmLabel={isActive ? 'Suspend' : 'Restore'}
        destructive={isActive}
        onConfirm={async () => {
          const ok = await run('access', () =>
            setOrganizationActiveAction(organizationId, !isActive, accessReason),
          );
          if (ok) {
            setAccessReason('');
            toast.success(isActive ? `${name} suspended` : `${name} restored`);
          }
        }}
      />
    </div>
  );
}
