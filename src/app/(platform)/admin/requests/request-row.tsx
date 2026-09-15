'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { runAction } from '@/lib/client-action';
import {
  declinePlanRequestAction,
  setOrganizationPlanAction,
} from '@/server/actions/platform';

/** Approve or decline, straight from the queue, without losing your place. */
export function RequestRow({
  organizationId,
  organizationName,
  plan,
  planLabel,
  billing,
}: {
  organizationId: string;
  organizationName: string;
  plan: string;
  planLabel: string;
  billing: 'monthly' | 'annual';
}) {
  const router = useRouter();
  const [approving, setApproving] = React.useState(false);
  const [declining, setDeclining] = React.useState(false);
  const [reason, setReason] = React.useState('');

  return (
    <>
      <Button size="sm" onClick={() => setApproving(true)}>
        <Check /> Approve
      </Button>
      <Button variant="secondary" size="sm" onClick={() => setDeclining(true)}>
        <X /> Decline
      </Button>

      <ConfirmDialog
        open={approving}
        onOpenChange={setApproving}
        title={`Put ${organizationName} on ${planLabel}?`}
        description={`They move to ${planLabel}, billed ${
          billing === 'annual' ? 'yearly' : 'monthly'
        }, and are told so in their workspace. Nothing is charged: arranging payment is still a conversation.`}
        confirmLabel="Approve"
        onConfirm={async () => {
          const result = await runAction(() =>
            setOrganizationPlanAction(organizationId, { plan, billing, note: '' }),
          );
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          toast.success(`${organizationName} is on ${planLabel}`);
          router.refresh();
        }}
      />

      <ConfirmDialog
        open={declining}
        onOpenChange={(next) => {
          setDeclining(next);
          if (!next) setReason('');
        }}
        title={`Decline ${organizationName}'s request?`}
        description={
          <div className="space-y-3">
            <p>What you write here is sent to them and kept on the record.</p>
            <Textarea
              rows={3}
              autoFocus
              placeholder="We have extended your trial instead while we sort out payment."
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
        }
        confirmLabel="Decline"
        destructive
        onConfirm={async () => {
          const result = await runAction(() =>
            declinePlanRequestAction(organizationId, reason),
          );
          if (!result.ok) {
            toast.error(result.error);
            return;
          }
          setReason('');
          toast.success('Request declined and the workspace told');
          router.refresh();
        }}
      />
    </>
  );
}
