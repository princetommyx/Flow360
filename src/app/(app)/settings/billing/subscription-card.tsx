'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { CreditCard, Download, RefreshCw, ShieldCheck, TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { cancelSubscriptionAction } from '@/server/actions/billing';

/**
 * What this workspace is paying, and the one control that changes it.
 *
 * The cancel button is here rather than in the plan chooser because it is not
 * a choice between plans: it ends the arrangement, and it reads differently
 * from picking one.
 *
 * Every date arrives already formatted. Rendering one here would mean an
 * `Intl` call in the browser against a locale that need not match the
 * server's, which React reports as a hydration mismatch on a page whose job is
 * to look reliable.
 */
export function SubscriptionCard({
  status,
  renews,
  hasSubscription,
  periodEndLabel,
  periodEndsInFuture,
  openedAtLabel,
  supportEmail,
  isOwner,
  payable,
}: {
  status: 'trialing' | 'active' | 'past_due' | 'cancelled' | string;
  /** True only while Paystack holds a live subscription that will charge again. */
  renews: boolean;
  /**
   * Whether there is a subscription to stop at all. Wider than `renews`, so a
   * workspace whose renewal was declined can still call it off rather than
   * waiting for the retries to run out.
   */
  hasSubscription: boolean;
  /** End of the period already paid for, formatted, or null. */
  periodEndLabel: string | null;
  /**
   * Whether that end is still ahead of us. Compared on the server: a date
   * comparison in the browser is against the reader's clock, and this one
   * decides whether we tell somebody they are still paid up.
   */
  periodEndsInFuture: boolean;
  openedAtLabel: string;
  supportEmail: string;
  isOwner: boolean;
  /** Whether a card payment can be started at all on this deployment. */
  payable: boolean;
}) {
  const router = useRouter();
  const [asking, setAsking] = React.useState(false);

  async function cancel() {
    const result = await cancelSubscriptionAction();
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    toast.success('Subscription cancelled', {
      description:
        periodEndsInFuture && periodEndLabel
          ? `It will not renew. You keep everything until ${periodEndLabel}.`
          : 'It will not renew again.',
    });
    router.refresh();
  }

  /*
    One state, decided once. Working it out separately for the heading and for
    the paragraph is how a card ends up saying "Nothing is charged yet" above a
    renewal date.
  */
  const mode: 'failed' | 'renewing' | 'winding-down' | 'lapsed' | 'none' =
    status === 'past_due'
      ? 'failed'
      : renews
        ? 'renewing'
        : periodEndsInFuture && (status === 'active' || status === 'cancelled')
          ? 'winding-down'
          : status === 'cancelled'
            ? 'lapsed'
            : 'none';

  const title =
    mode === 'failed'
      ? 'Your last payment failed'
      : mode === 'renewing'
        ? 'Subscription active'
        : mode === 'winding-down'
          ? 'Paid, not renewing'
          : mode === 'lapsed'
            ? 'Subscription ended'
            : payable
              ? 'Paying for this workspace'
              : 'Nothing is charged yet';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-[13px] leading-relaxed text-muted-foreground">
        {mode === 'failed' ? (
          <p className="flex items-start gap-2">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            <span>
              We could not take the last renewal from your card. Nothing has been
              switched off
              {periodEndsInFuture && periodEndLabel
                ? `, and this period runs to ${periodEndLabel}`
                : ''}
              . Choose your plan again below to pay with a different card or with
              mobile money.
            </span>
          </p>
        ) : mode === 'renewing' ? (
          <p className="flex items-start gap-2">
            <RefreshCw className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
            <span>
              {periodEndLabel
                ? `Renews on ${periodEndLabel} and carries on until you stop it.`
                : 'Renews on its own until you stop it.'}{' '}
              Every charge shows on your Paystack receipt by email.
            </span>
          </p>
        ) : mode === 'winding-down' ? (
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
            <span>
              This workspace is paid up to {periodEndLabel} and will not be charged
              again. Everything keeps working until then, and choosing a plan below
              starts the subscription up once more.
            </span>
          </p>
        ) : mode === 'lapsed' ? (
          <p className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span>
              The subscription has ended and nothing is being charged. Everything you
              entered is still here; choosing a plan below starts it again.
            </span>
          </p>
        ) : (
          <p className="flex items-start gap-2">
            {payable ? (
              <CreditCard className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            ) : (
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
            )}
            <span>
              {payable
                ? 'No card is stored against this workspace. Choosing a plan below opens Paystack, where you pay by card, mobile money or bank — we never see the card number.'
                : 'No card is stored against this workspace, so no payment can be taken. Choosing a plan below records the request and we follow up by email.'}
            </span>
          </p>
        )}

        <p className="flex items-start gap-2">
          <Download className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
          <span>
            Your data stays yours either way. Every list and report exports to CSV,
            and invoices print to PDF.
          </span>
        </p>

        {hasSubscription && isOwner ? (
          <div className="border-t border-border pt-3">
            <Button variant="secondary" size="sm" onClick={() => setAsking(true)}>
              Cancel subscription
            </Button>
          </div>
        ) : null}

        <p className="border-t border-border pt-3">
          Workspace opened {openedAtLabel}. Questions about billing go to{' '}
          <a
            href={`mailto:${supportEmail}`}
            className="font-medium text-primary hover:underline"
          >
            {supportEmail}
          </a>
          .
        </p>
      </CardContent>

      <ConfirmDialog
        open={asking}
        onOpenChange={setAsking}
        title="Cancel this subscription?"
        description={
          <>
            <p>
              {periodEndsInFuture && periodEndLabel
                ? `You keep everything until ${periodEndLabel}, the end of the period you have already paid for. Nothing is refunded and nothing is cut short.`
                : 'You keep the period you have already paid for. Nothing is refunded and nothing is cut short.'}
            </p>
            <p className="mt-2">
              After that the workspace stops being charged. Your records stay where
              they are and exports keep working, and you can start a plan again at any
              time.
            </p>
          </>
        }
        confirmLabel="Cancel subscription"
        cancelLabel="Keep it running"
        destructive
        onConfirm={cancel}
      />
    </Card>
  );
}
