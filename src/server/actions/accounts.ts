'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { accountSchema } from '@/lib/validations/account';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { logActivity } from '@/server/activity';
import { actionError, actionOk, type ActionResult } from '@/server/actions/types';
import { nullifyBlanks } from '@/server/actions/utils';

const OPTIONAL_FIELDS = ['bankName', 'accountNumber', 'description'] as const;

export async function createAccountAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { organization, user } = await requirePermission('accounts.create');

    const parsed = accountSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the details entered.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }

    const account = await db.$transaction(async (tx) => {
      const created = await tx.account.create({
        data: {
          ...nullifyBlanks(parsed.data, OPTIONAL_FIELDS),
          organizationId: organization.id,
          currency: organization.currency,
          // A brand new account holds exactly what it opened with.
          currentBalance: parsed.data.openingBalance,
        },
        select: { id: true, name: true },
      });

      if (parsed.data.isPrimary) {
        await tx.account.updateMany({
          where: {
            organizationId: organization.id,
            id: { not: created.id },
            isPrimary: true,
          },
          data: { isPrimary: false },
        });
      }

      return created;
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'create',
      entityType: 'account',
      entityId: account.id,
      summary: `Added account ${account.name}`,
    });

    revalidatePath('/accounts');
    return actionOk({ id: account.id });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function updateAccountAction(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { organization, user } = await requirePermission('accounts.edit');

    const parsed = accountSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the details entered.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }

    const existing = await db.account.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: { id: true, openingBalance: true, currentBalance: true },
    });
    if (!existing) return actionError('That account no longer exists.');

    // Changing the opening balance shifts everything that followed it by the
    // same amount, rather than discarding the movements recorded since.
    const openingDelta =
      parsed.data.openingBalance - Number(existing.openingBalance);

    await db.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: existing.id },
        data: {
          ...nullifyBlanks(parsed.data, OPTIONAL_FIELDS),
          currentBalance: Number(existing.currentBalance) + openingDelta,
        },
      });

      if (parsed.data.isPrimary) {
        await tx.account.updateMany({
          where: {
            organizationId: organization.id,
            id: { not: existing.id },
            isPrimary: true,
          },
          data: { isPrimary: false },
        });
      }
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'account',
      entityId: existing.id,
      summary: `Updated account ${parsed.data.name}`,
    });

    revalidatePath('/accounts');
    return actionOk({ id: existing.id });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/** Soft delete, refused while money has moved through the account. */
export async function deleteAccountAction(id: string): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('accounts.delete');

    const account = await db.account.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: {
        id: true,
        name: true,
        _count: { select: { transactions: true, payments: true, expenses: true } },
      },
    });
    if (!account) return actionError('That account no longer exists.');

    const used =
      account._count.transactions + account._count.payments + account._count.expenses;
    if (used > 0) {
      return actionError(
        `${account.name} has ${used} record${used === 1 ? '' : 's'} against it. Mark it inactive instead, so the history stays readable.`,
      );
    }

    await db.account.update({
      where: { id: account.id },
      data: { deletedAt: new Date() },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'delete',
      entityType: 'account',
      entityId: account.id,
      summary: `Removed account ${account.name}`,
    });

    revalidatePath('/accounts');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}
