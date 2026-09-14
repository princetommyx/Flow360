'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { findPlan } from '@/lib/config/plans';
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
