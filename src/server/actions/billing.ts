'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { PLATFORM_CURRENCY, findPlan, planPrice } from '@/lib/config/plans';
import { planCodeFor } from '@/lib/config/paystack';
import { round } from '@/lib/money';
import { absoluteUrl } from '@/lib/url';
import {
  disableSubscription,
  fetchPlan,
  fromMinorUnits,
  initializeSubscription,
} from '@/server/services/paystack';
import { sendMail } from '@/lib/mailer';
import { subscriptionRequestedEmail } from '@/lib/email/templates';
import { planRequestSchema } from '@/lib/validations/billing';
import { AuthorizationError, requirePermission } from '@/server/tenant';
import { logActivity } from '@/server/activity';
import { actionError, actionOk, type ActionResult } from '@/server/actions/types';

/**
 * Records the plan the owner wants to move to.
 *
 * There is no payment provider wired up, so this deliberately does not pretend
 * to take money: it stores the request, logs it, and the billing page says
 * plainly that someone will be in touch. Swapping in a checkout session later
 * only changes what happens after the request is written.
 */
export async function requestPlanAction(input: unknown): Promise<ActionResult> {
  try {
    const { organization, user, membership } = await requirePermission('settings.edit');

    // Owners only: a plan change is a commercial decision, not a setting.
    if (!membership.isOwner) {
      return actionError('Only the workspace owner can change the plan.');
    }

    const parsed = planRequestSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(parsed.error.issues[0]?.message ?? 'Choose a plan.');
    }

    const plan = findPlan(parsed.data.plan);
    if (!plan) return actionError('That plan is no longer available.');

    const updated = await db.organization.update({
      where: { id: organization.id },
      data: { requestedPlan: plan.id, requestedBilling: parsed.data.period },
      select: { name: true, trialEndsAt: true },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'organization',
      entityId: organization.id,
      summary: `Requested the ${plan.name} plan, billed ${
        parsed.data.period === 'annual' ? 'yearly' : 'monthly'
      }`,
      metadata: { plan: plan.id, period: parsed.data.period },
    });

    // A receipt for a request nobody was charged for: it is the only record
    // the owner keeps outside the app. Best-effort — the request is already
    // stored, and a provider outage must not report it as having failed.
    if (user.email) {
      try {
        await sendMail(
          subscriptionRequestedEmail({
            to: user.email,
            name: user.name,
            organizationName: updated.name,
            plan,
            period: parsed.data.period,
            trialEndsAt: updated.trialEndsAt,
          }),
        );
      } catch (error) {
        console.error('Plan request email could not be sent', error);
      }
    }

    revalidatePath('/settings/billing');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/** Withdraws a pending plan request, so the choice is reversible. */
export async function cancelPlanRequestAction(): Promise<ActionResult> {
  try {
    const { organization, user, membership } = await requirePermission('settings.edit');

    if (!membership.isOwner) {
      return actionError('Only the workspace owner can change the plan.');
    }

    await db.organization.update({
      where: { id: organization.id },
      data: { requestedPlan: null, requestedBilling: null },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'organization',
      entityId: organization.id,
      summary: 'Withdrew the pending plan request',
    });

    revalidatePath('/settings/billing');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/**
 * Starts a Paystack checkout for a plan.
 *
 * Returns the URL to send the person to rather than redirecting, so a failure
 * is a message on the page they are already looking at instead of a bounce to
 * somewhere that cannot explain itself.
 *
 * Nothing here marks anybody as subscribed. Reaching the checkout is not
 * paying, and the only thing that decides whether money arrived is Paystack's
 * webhook.
 */
export async function startCheckoutAction(
  input: unknown,
): Promise<ActionResult<{ url: string }>> {
  try {
    const { organization, user, membership } = await requirePermission('settings.edit');

    if (!membership.isOwner) {
      return actionError('Only the workspace owner can change the plan.');
    }

    const parsed = planRequestSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(parsed.error.issues[0]?.message ?? 'Choose a plan.');
    }

    const plan = findPlan(parsed.data.plan);
    if (!plan) return actionError('That plan is no longer available.');

    const planCode = planCodeFor(plan.id, parsed.data.period);
    if (!planCode) {
      return actionError(
        `${plan.name} is not available to buy online yet. Ask us and we will set it up.`,
      );
    }

    /*
      The price on the page and the price Paystack will charge are configured
      in two different places, so they are compared before anybody is sent to
      a checkout. Being charged something other than the figure you agreed to
      is the one failure in this flow that cannot be apologised away, and it
      is cheap to make impossible.
    */
    const remote = await fetchPlan(planCode);
    if (!remote.ok) return actionError(remote.error);

    const shown = planPrice(plan, parsed.data.period);
    const charged = fromMinorUnits(remote.data.amount);

    if (shown === null || round(shown) !== charged) {
      console.error('Paystack plan price does not match the displayed price', {
        plan: plan.id,
        period: parsed.data.period,
        shown,
        charged,
        planCode,
      });
      return actionError(
        'This plan is mid-update and we do not want to charge you the wrong amount. Please try again shortly.',
      );
    }

    if (remote.data.currency !== PLATFORM_CURRENCY) {
      console.error('Paystack plan is in an unexpected currency', {
        planCode,
        expected: PLATFORM_CURRENCY,
        actual: remote.data.currency,
      });
      return actionError('This plan is not set up correctly yet. Please get in touch.');
    }

    const started = await initializeSubscription({
      email: user.email,
      planCode,
      callbackUrl: absoluteUrl('/settings/billing/complete'),
      // Carried back on every future renewal, which is how a charge twelve
      // months from now still knows whose it is.
      metadata: {
        organizationId: organization.id,
        organizationName: organization.name,
        plan: plan.id,
        period: parsed.data.period,
      },
    });

    if (!started.ok) return actionError(started.error);

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'organization',
      entityId: organization.id,
      summary: `Started checkout for ${plan.name}, billed ${
        parsed.data.period === 'annual' ? 'yearly' : 'monthly'
      }`,
      metadata: { plan: plan.id, period: parsed.data.period, reference: started.data.reference },
    });

    return actionOk({ url: started.data.authorization_url });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/**
 * Stops a subscription renewing.
 *
 * The period already paid for is not cut short and not refunded, which is
 * Paystack's behaviour and also the fair one. The workspace keeps working
 * until `subscriptionEndsAt`.
 */
export async function cancelSubscriptionAction(): Promise<ActionResult> {
  try {
    const { organization, user, membership } = await requirePermission('settings.edit');

    if (!membership.isOwner) {
      return actionError('Only the workspace owner can cancel the subscription.');
    }

    const current = await db.organization.findUniqueOrThrow({
      where: { id: organization.id },
      select: { paystackSubscription: true, paystackEmailToken: true },
    });

    if (!current.paystackSubscription || !current.paystackEmailToken) {
      return actionError('There is no active subscription on this workspace.');
    }

    const result = await disableSubscription(
      current.paystackSubscription,
      current.paystackEmailToken,
    );
    if (!result.ok) return actionError(result.error);

    // Paystack confirms with a `subscription.disable` webhook, which is what
    // actually writes the cancelled status. This only records the intent, so
    // the two cannot contradict each other.
    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'organization',
      entityId: organization.id,
      summary: 'Cancelled the subscription',
    });

    revalidatePath('/settings/billing');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}
