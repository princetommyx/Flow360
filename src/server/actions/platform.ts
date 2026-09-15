'use server';

import { revalidatePath } from 'next/cache';
import { addDays } from 'date-fns';

import { db } from '@/lib/db';
import { findPlan, planPrice, type BillingPeriod } from '@/lib/config/plans';
import {
  extendTrialSchema,
  setPlanSchema,
  suspendSchema,
} from '@/lib/validations/platform';
import { AuthorizationError } from '@/server/tenant';
import { logPlatformAction, requirePlatformAdmin } from '@/server/platform';
import { notify } from '@/server/activity';
import { actionError, actionOk, type ActionResult } from '@/server/actions/types';

/**
 * Everything the operator console changes.
 *
 * Each one re-checks `requirePlatformAdmin`, because a page guard protects a
 * page and nothing else: an action is a public endpoint that happens to be
 * called from one. Each one also writes an audit row, so the console leaves a
 * trail of its own separate from anything a workspace can see or delete.
 */

function refresh(organizationId?: string) {
  revalidatePath('/admin');
  revalidatePath('/admin/organizations');
  revalidatePath('/admin/requests');
  revalidatePath('/admin/users');
  if (organizationId) revalidatePath(`/admin/organizations/${organizationId}`);
}

async function organizationOrNull(id: string) {
  return db.organization.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      name: true,
      plan: true,
      isActive: true,
      requestedPlan: true,
      requestedBilling: true,
      subscriptionStatus: true,
    },
  });
}

/**
 * Moving a workspace on to a plan.
 *
 * This is the approval half of a plan request: nothing charges anyone, so the
 * decision is a person's and the record of it is this action plus its audit
 * row. The request is cleared either way, so the queue never shows a decision
 * that has already been taken.
 */
export async function setOrganizationPlanAction(
  organizationId: string,
  input: unknown,
): Promise<ActionResult> {
  try {
    const context = await requirePlatformAdmin();

    const parsed = setPlanSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the details.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;

    const organization = await organizationOrNull(organizationId);
    if (!organization) return actionError('That workspace no longer exists.');

    const plan = findPlan(data.plan);
    if (!plan) return actionError('Choose a plan from the list.', 'plan');

    await db.organization.update({
      where: { id: organization.id },
      data: {
        plan: data.plan,
        requestedBilling: data.billing,
        subscriptionStatus: 'active',
        requestedPlan: null,
      },
    });

    const price = planPrice(plan, data.billing as BillingPeriod);

    await logPlatformAction({
      actorUserId: context.user.id,
      action: 'plan.set',
      targetType: 'organization',
      targetId: organization.id,
      summary: `Moved ${organization.name} from ${organization.plan} to ${data.plan} (${data.billing})`,
      metadata: {
        from: organization.plan,
        to: data.plan,
        billing: data.billing,
        price,
        note: data.note || null,
      },
    });

    await notify({
      organizationId: organization.id,
      type: 'SYSTEM',
      title: `You are on the ${plan.name} plan`,
      body: `Your request has been approved and ${plan.name} is active on this workspace.`,
      href: '/settings/billing',
    });

    refresh(organization.id);
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/** Turning a request down. The workspace keeps the plan it is on. */
export async function declinePlanRequestAction(
  organizationId: string,
  reason: string,
): Promise<ActionResult> {
  try {
    const context = await requirePlatformAdmin();

    const parsed = suspendSchema.safeParse({ reason });
    if (!parsed.success) {
      return actionError(parsed.error.issues[0]?.message ?? 'Say why.');
    }

    const organization = await organizationOrNull(organizationId);
    if (!organization) return actionError('That workspace no longer exists.');
    if (!organization.requestedPlan) {
      return actionError('There is no open request for that workspace.');
    }

    await db.organization.update({
      where: { id: organization.id },
      data: { requestedPlan: null, requestedBilling: null },
    });

    await logPlatformAction({
      actorUserId: context.user.id,
      action: 'plan.decline',
      targetType: 'organization',
      targetId: organization.id,
      summary: `Declined ${organization.name}'s request for ${organization.requestedPlan}`,
      metadata: { requested: organization.requestedPlan, reason: parsed.data.reason },
    });

    await notify({
      organizationId: organization.id,
      type: 'SYSTEM',
      title: 'About your plan request',
      body: `${parsed.data.reason} Get in touch if you would like to talk it through.`,
      href: '/settings/billing',
    });

    refresh(organization.id);
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/**
 * Giving a trial more room.
 *
 * Counted from whichever is later, today or the current end date, so extending
 * an expired trial gives the full extra days rather than a date in the past.
 */
export async function extendTrialAction(
  organizationId: string,
  input: unknown,
): Promise<ActionResult<{ trialEndsAt: string }>> {
  try {
    const context = await requirePlatformAdmin();

    const parsed = extendTrialSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the details.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }

    const organization = await db.organization.findFirst({
      where: { id: organizationId, deletedAt: null },
      select: { id: true, name: true, trialEndsAt: true },
    });
    if (!organization) return actionError('That workspace no longer exists.');

    const now = new Date();
    const from =
      organization.trialEndsAt && organization.trialEndsAt > now
        ? organization.trialEndsAt
        : now;
    const trialEndsAt = addDays(from, parsed.data.days);

    await db.organization.update({
      where: { id: organization.id },
      data: { trialEndsAt, subscriptionStatus: 'trialing' },
    });

    await logPlatformAction({
      actorUserId: context.user.id,
      action: 'trial.extend',
      targetType: 'organization',
      targetId: organization.id,
      summary: `Extended ${organization.name}'s trial by ${parsed.data.days} days`,
      metadata: {
        days: parsed.data.days,
        from: organization.trialEndsAt?.toISOString() ?? null,
        to: trialEndsAt.toISOString(),
        note: parsed.data.note || null,
      },
    });

    await notify({
      organizationId: organization.id,
      type: 'SYSTEM',
      title: 'Your trial has been extended',
      body: `You now have until ${trialEndsAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} on the full feature set.`,
      href: '/settings/billing',
    });

    refresh(organization.id);
    return actionOk({ trialEndsAt: trialEndsAt.toISOString() });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/**
 * Suspending a workspace, and letting it back in.
 *
 * Suspension takes away access and nothing else: not one row of the
 * workspace's own data is touched, so restoring is a single flag and the
 * people in it find everything exactly where they left it.
 */
export async function setOrganizationActiveAction(
  organizationId: string,
  isActive: boolean,
  reason: string,
): Promise<ActionResult> {
  try {
    const context = await requirePlatformAdmin();

    const parsed = suspendSchema.safeParse({ reason });
    if (!parsed.success) {
      return actionError(parsed.error.issues[0]?.message ?? 'Say why.');
    }

    const organization = await organizationOrNull(organizationId);
    if (!organization) return actionError('That workspace no longer exists.');
    if (organization.isActive === isActive) {
      return actionError(
        isActive ? 'That workspace is not suspended.' : 'That workspace is already suspended.',
      );
    }

    await db.organization.update({
      where: { id: organization.id },
      data: { isActive },
    });

    await logPlatformAction({
      actorUserId: context.user.id,
      action: isActive ? 'organization.restore' : 'organization.suspend',
      targetType: 'organization',
      targetId: organization.id,
      summary: `${isActive ? 'Restored' : 'Suspended'} ${organization.name}`,
      metadata: { reason: parsed.data.reason },
    });

    refresh(organization.id);
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/**
 * Handing out, and taking back, access to this console.
 *
 * You cannot revoke your own: the way out of a console with no operators left
 * is the environment list, and needing to reach for it because someone clicked
 * the wrong row is avoidable.
 */
export async function setPlatformAdminAction(
  userId: string,
  isPlatformAdmin: boolean,
): Promise<ActionResult> {
  try {
    const context = await requirePlatformAdmin();

    if (userId === context.user.id && !isPlatformAdmin) {
      return actionError('You cannot take away your own access. Ask another operator.');
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, isPlatformAdmin: true },
    });
    if (!user) return actionError('That account no longer exists.');
    if (user.isPlatformAdmin === isPlatformAdmin) {
      return actionError('Nothing to change there.');
    }

    await db.user.update({ where: { id: user.id }, data: { isPlatformAdmin } });

    await logPlatformAction({
      actorUserId: context.user.id,
      action: isPlatformAdmin ? 'staff.grant' : 'staff.revoke',
      targetType: 'user',
      targetId: user.id,
      summary: `${isPlatformAdmin ? 'Granted' : 'Revoked'} operator access for ${user.email}`,
    });

    refresh();
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/** Disabling an account across every workspace it belongs to. */
export async function setUserActiveAction(
  userId: string,
  isActive: boolean,
  reason: string,
): Promise<ActionResult> {
  try {
    const context = await requirePlatformAdmin();

    if (userId === context.user.id) {
      return actionError('You cannot disable your own account from here.');
    }

    const parsed = suspendSchema.safeParse({ reason });
    if (!parsed.success) {
      return actionError(parsed.error.issues[0]?.message ?? 'Say why.');
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, isActive: true },
    });
    if (!user) return actionError('That account no longer exists.');
    if (user.isActive === isActive) return actionError('Nothing to change there.');

    await db.user.update({ where: { id: user.id }, data: { isActive } });

    await logPlatformAction({
      actorUserId: context.user.id,
      action: isActive ? 'user.enable' : 'user.disable',
      targetType: 'user',
      targetId: user.id,
      summary: `${isActive ? 'Enabled' : 'Disabled'} ${user.email}`,
      metadata: { reason: parsed.data.reason },
    });

    refresh();
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}
