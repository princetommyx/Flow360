'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { findPlan } from '@/lib/config/plans';
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

    await db.organization.update({
      where: { id: organization.id },
      data: { requestedPlan: plan.id },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'organization',
      entityId: organization.id,
      summary: `Requested the ${plan.name} plan`,
      metadata: { plan: plan.id },
    });

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
      data: { requestedPlan: null },
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
