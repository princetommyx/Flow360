import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { brand } from '@/lib/config/brand';
import { requireTenant } from '@/server/tenant';
import { verifyTransaction } from '@/server/services/paystack';

export const metadata: Metadata = { title: 'Payment' };

/**
 * Where Paystack sends somebody back to.
 *
 * This page reports; it does not decide. The webhook is what marks a workspace
 * subscribed, because a browser can be closed on the way back and a renewal a
 * year from now involves no browser at all. So this verifies the reference
 * only to tell the person what happened, and says plainly when the two have
 * not caught up with each other yet.
 */
export default async function PaymentCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const context = await requireTenant();
  const params = await searchParams;

  // Paystack sends both; they are the same value.
  const reference = params.reference ?? params.trxref;
  if (!reference) redirect('/settings/billing');

  const result = await verifyTransaction(reference);
  const succeeded = result.ok && result.data.status === 'success';

  const organization = context.organization;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <PageHeader title={succeeded ? 'Payment received' : 'Payment not completed'} />

      <Card className="p-6 text-center">
        <div
          className={
            succeeded
              ? 'mx-auto flex size-12 items-center justify-center rounded-xl bg-success-soft text-success'
              : 'mx-auto flex size-12 items-center justify-center rounded-xl bg-warning-soft text-warning'
          }
        >
          {succeeded ? (
            <CheckCircle2 className="size-6" aria-hidden />
          ) : result.ok ? (
            <Clock className="size-6" aria-hidden />
          ) : (
            <AlertTriangle className="size-6" aria-hidden />
          )}
        </div>

        <h2 className="mt-5 text-[17px] font-semibold tracking-[-0.02em]">
          {succeeded
            ? `Thank you, ${organization.name} is subscribed`
            : result.ok
              ? 'That payment has not completed'
              : 'We could not confirm that payment'}
        </h2>

        <p className="mt-2 text-pretty text-[13.5px] leading-relaxed text-muted-foreground">
          {succeeded
            ? 'Your card has been charged and the subscription renews on its own. It can take a moment for the badge on your billing page to catch up, because we wait for the provider to confirm it rather than taking your word or ours.'
            : result.ok
              ? 'Nothing has been charged. If you closed the card screen or the payment was declined, you can start again from the billing page.'
              : `We could not reach the payment provider to check. If money has left your account it will still be applied, and you can write to ${brand.supportEmail} with the reference below.`}
        </p>

        <p className="tabular mt-4 rounded-md border border-border bg-surface-subtle px-3 py-2 font-mono text-[12px] text-muted-foreground">
          {reference}
        </p>

        <Button asChild className="mt-6">
          <Link href="/settings/billing">Back to billing</Link>
        </Button>
      </Card>
    </div>
  );
}
