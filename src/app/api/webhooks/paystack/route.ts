import { addDays, addYears } from 'date-fns';

import { db } from '@/lib/db';
import { findPlan } from '@/lib/config/plans';
import { fromMinorUnits, webhookIsGenuine } from '@/server/services/paystack';
import { notify } from '@/server/activity';
import { Prisma } from '@/generated/prisma/client';

/**
 * Paystack's account of what has happened.
 *
 * This, not the page the customer comes back to, is the authority on whether
 * somebody has paid. A browser can be closed on the way back from the checkout,
 * and a renewal twelve months from now involves no browser at all.
 *
 * Three rules hold throughout:
 *
 *  - Nothing is trusted before the signature is verified against the raw body.
 *  - Every event is recorded by its own reference, which is unique, so a
 *    redelivery writes nothing the second time. Paystack retries, and a retry
 *    must not extend a subscription twice.
 *  - Anything unrecognised is acknowledged, not refused. Answering 4xx makes
 *    Paystack retry an event we will never understand, forever.
 */

// The signature covers the exact bytes sent, so the body must not be re-encoded
// anywhere before it is checked.
export const dynamic = 'force-dynamic';

type PaystackEvent = {
  event: string;
  data: Record<string, unknown> & {
    reference?: string;
    status?: string;
    amount?: number;
    currency?: string;
    paid_at?: string;
    created_at?: string;
    customer?: { customer_code?: string; email?: string };
    plan?: { plan_code?: string; interval?: string; name?: string };
    subscription_code?: string;
    email_token?: string;
    next_payment_date?: string;
    metadata?: Record<string, unknown> | null;
  };
};

/** Paystack sends `monthly`, `annually`, `weekly`… we keep two of them. */
function periodFromInterval(interval: string | undefined): 'monthly' | 'annual' | null {
  if (!interval) return null;
  if (interval.startsWith('month')) return 'monthly';
  if (interval.startsWith('annual') || interval.startsWith('year')) return 'annual';
  return null;
}

/**
 * Which workspace an event belongs to.
 *
 * The metadata we set at checkout is the reliable answer and is checked first.
 * A renewal a year later carries it too, because Paystack keeps a
 * subscription's metadata, but a subscription that was repaired by hand in the
 * dashboard might not, so the customer code is a second way in.
 */
async function organizationFor(event: PaystackEvent): Promise<string | null> {
  const fromMetadata = event.data.metadata?.organizationId;
  if (typeof fromMetadata === 'string' && fromMetadata) {
    const found = await db.organization.findFirst({
      where: { id: fromMetadata, deletedAt: null },
      select: { id: true },
    });
    if (found) return found.id;
  }

  const customer = event.data.customer?.customer_code;
  if (customer) {
    const found = await db.organization.findFirst({
      where: { paystackCustomer: customer, deletedAt: null },
      select: { id: true },
    });
    if (found) return found.id;
  }

  const subscription = event.data.subscription_code;
  if (subscription) {
    const found = await db.organization.findFirst({
      where: { paystackSubscription: subscription, deletedAt: null },
      select: { id: true },
    });
    if (found) return found.id;
  }

  return null;
}

/**
 * Records the event, and says whether this is the first time we have seen it.
 *
 * The unique reference does the work: a redelivery collides and is reported as
 * already handled, so the caller can stop before acting on it twice.
 *
 * Only that collision counts as "seen before". Catching everything here would
 * turn a broken database into a webhook that cheerfully answers "duplicate" to
 * every payment ever made, which is the quietest way imaginable to stop taking
 * money.
 */
async function record(
  organizationId: string,
  event: PaystackEvent,
  reference: string,
): Promise<boolean> {
  try {
    await db.billingEvent.create({
      data: {
        organizationId,
        type: event.event,
        reference,
        status: String(event.data.status ?? 'unknown'),
        amount: fromMinorUnits(event.data.amount),
        currency: String(event.data.currency ?? 'GHS'),
        plan:
          typeof event.data.metadata?.plan === 'string'
            ? (event.data.metadata.plan as string)
            : null,
        period: periodFromInterval(event.data.plan?.interval),
        payload: event as unknown as Prisma.InputJsonValue,
        occurredAt: event.data.paid_at ? new Date(event.data.paid_at) : new Date(),
      },
    });
    return true;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return false;
    }

    console.error('Paystack event could not be recorded', {
      event: event.event,
      reference,
      error,
    });
    throw error;
  }
}

async function handleChargeSuccess(organizationId: string, event: PaystackEvent) {
  const interval = event.data.plan?.interval;
  const period = periodFromInterval(interval) ?? 'monthly';
  const planId =
    typeof event.data.metadata?.plan === 'string'
      ? (event.data.metadata.plan as string)
      : null;

  // A day of slack on the period end, so a renewal that lands a few hours late
  // does not lock a paying customer out of their own books in the meantime.
  const now = new Date();
  const endsAt =
    event.data.next_payment_date
      ? addDays(new Date(event.data.next_payment_date), 1)
      : period === 'annual'
        ? addYears(now, 1)
        : addDays(now, 31);

  await db.organization.update({
    where: { id: organizationId },
    data: {
      subscriptionStatus: 'active',
      subscriptionEndsAt: endsAt,
      requestedPlan: null,
      ...(planId && findPlan(planId) ? { plan: planId, requestedBilling: period } : {}),
      ...(event.data.customer?.customer_code
        ? { paystackCustomer: event.data.customer.customer_code }
        : {}),
    },
  });

  await notify({
    organizationId,
    type: 'SYSTEM',
    title: 'Payment received',
    body: `Thank you. Your subscription is active${
      planId && findPlan(planId) ? ` on ${findPlan(planId)!.name}` : ''
    }.`,
    href: '/settings/billing',
  });
}

async function handleSubscriptionCreate(organizationId: string, event: PaystackEvent) {
  await db.organization.update({
    where: { id: organizationId },
    data: {
      paystackSubscription: event.data.subscription_code ?? null,
      paystackEmailToken: event.data.email_token ?? null,
      ...(event.data.customer?.customer_code
        ? { paystackCustomer: event.data.customer.customer_code }
        : {}),
    },
  });
}

/**
 * A renewal that did not go through.
 *
 * The workspace is marked past due and told, but nothing is taken away: the
 * period they already paid for is theirs, and Paystack retries a failed charge
 * several times before giving up.
 */
async function handlePaymentFailed(organizationId: string) {
  await db.organization.update({
    where: { id: organizationId },
    data: { subscriptionStatus: 'past_due' },
  });

  await notify({
    organizationId,
    type: 'SYSTEM',
    title: 'We could not take your payment',
    body: 'Your card was declined on the last renewal. Update it on the billing page to keep your subscription running.',
    href: '/settings/billing',
  });
}

/** The subscription has stopped renewing, by cancellation or by exhaustion. */
async function handleSubscriptionDisable(organizationId: string) {
  await db.organization.update({
    where: { id: organizationId },
    data: {
      subscriptionStatus: 'cancelled',
      paystackSubscription: null,
      paystackEmailToken: null,
    },
  });

  await notify({
    organizationId,
    type: 'SYSTEM',
    title: 'Your subscription has ended',
    body: 'It will not renew again. Everything you have entered stays where it is, and exports keep working.',
    href: '/settings/billing',
  });
}

export async function POST(request: Request) {
  const raw = await request.text();

  if (!webhookIsGenuine(raw, request.headers.get('x-paystack-signature'))) {
    // Deliberately terse. Anyone probing this address learns nothing about
    // whether the secret, the signature or the body was the problem.
    return new Response('Invalid signature', { status: 401 });
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(raw) as PaystackEvent;
  } catch {
    return new Response('Malformed payload', { status: 400 });
  }

  const organizationId = await organizationFor(event);
  if (!organizationId) {
    // Acknowledged on purpose: an event for a workspace that no longer exists
    // is not a failure on our side and retrying it forever helps nobody.
    console.warn('Paystack event for an unknown workspace', {
      event: event.event,
      reference: event.data.reference,
    });
    return Response.json({ received: true, matched: false });
  }

  const reference =
    event.data.reference ??
    `${event.event}:${event.data.subscription_code ?? ''}:${event.data.created_at ?? Date.now()}`;

  let isNew: boolean;
  try {
    isNew = await record(organizationId, event, reference);
  } catch {
    // Nothing was written, so there is nothing to recover by hand. A 500 has
    // Paystack retry, which is exactly what should happen to an event we
    // failed to store: the retry will find no duplicate and try again.
    return new Response('Could not record event', { status: 500 });
  }

  if (!isNew) {
    return Response.json({ received: true, duplicate: true });
  }

  try {
    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(organizationId, event);
        break;
      case 'subscription.create':
        await handleSubscriptionCreate(organizationId, event);
        break;
      case 'invoice.payment_failed':
      case 'subscription.not_renew':
        await handlePaymentFailed(organizationId);
        break;
      case 'subscription.disable':
        await handleSubscriptionDisable(organizationId);
        break;
      default:
        // Recorded above, acted on by nobody. That is the right outcome for an
        // event we have no opinion about.
        break;
    }
  } catch (error) {
    // The event is already recorded, so a failure here is recoverable by hand
    // from the ledger. Answering 500 would have Paystack retry, which the
    // duplicate check would then swallow, losing the retry's only purpose.
    console.error('Paystack event could not be applied', {
      event: event.event,
      reference,
      error,
    });
  }

  return Response.json({ received: true });
}
