'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { toNumber } from '@/lib/money';
import {
  transactionSchema,
  type TransactionInput,
} from '@/lib/validations/transaction';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { logActivity } from '@/server/activity';
import { actionError, actionOk, type ActionResult } from '@/server/actions/types';

/**
 * The signed amount stored against the source account.
 *
 * Amounts are entered as positive figures whatever the type, so nobody has to
 * remember which way round an expense goes; the sign is derived here, once.
 */
function signedAmount(data: TransactionInput): number {
  return data.type === 'INCOME' ? data.amount : -data.amount;
}

/** Applies a movement to the account balances it touches. */
async function applyToBalances(
  tx: Parameters<Parameters<typeof db.$transaction>[0]>[0],
  data: {
    type: string;
    accountId: string;
    toAccountId: string | null;
    amount: number;
  },
  direction: 1 | -1,
) {
  const delta = direction * (data.type === 'INCOME' ? data.amount : -data.amount);

  await tx.account.update({
    where: { id: data.accountId },
    data: { currentBalance: { increment: delta } },
  });

  // A transfer is one row, but it moves two balances: out of the source and
  // into the destination.
  if (data.type === 'TRANSFER' && data.toAccountId) {
    await tx.account.update({
      where: { id: data.toAccountId },
      data: { currentBalance: { increment: direction * data.amount } },
    });
  }
}

async function ownedAccounts(organizationId: string, ids: string[]) {
  const accounts = await db.account.findMany({
    where: { id: { in: ids }, organizationId, deletedAt: null },
    select: { id: true, name: true },
  });
  return new Map(accounts.map((account) => [account.id, account]));
}

export async function createTransactionAction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { organization, user } = await requirePermission('transactions.create');

    const parsed = transactionSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the details.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;
    const toAccountId = data.type === 'TRANSFER' ? (data.toAccountId ?? null) : null;

    const accounts = await ownedAccounts(
      organization.id,
      [data.accountId, toAccountId].filter((id): id is string => Boolean(id)),
    );
    if (!accounts.has(data.accountId)) {
      return actionError('That account no longer exists.', 'accountId');
    }
    if (toAccountId && !accounts.has(toAccountId)) {
      return actionError('That destination account no longer exists.', 'toAccountId');
    }

    const created = await db.$transaction(async (tx) => {
      const row = await tx.transaction.create({
        data: {
          organizationId: organization.id,
          accountId: data.accountId,
          toAccountId,
          type: data.type,
          amount: signedAmount(data),
          currency: organization.currency,
          description: data.description,
          category: data.category || null,
          occurredAt: new Date(data.occurredAt),
          reference: data.reference || null,
          createdById: user.id,
        },
        select: { id: true },
      });

      await applyToBalances(
        tx,
        { type: data.type, accountId: data.accountId, toAccountId, amount: data.amount },
        1,
      );

      return row;
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'create',
      entityType: 'transaction',
      entityId: created.id,
      summary: `Recorded ${data.type.toLowerCase()} of ${data.amount}: ${data.description}`,
    });

    revalidatePath('/transactions');
    revalidatePath('/income');
    revalidatePath('/accounts');
    return actionOk({ id: created.id });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/**
 * Editing a hand-entered movement.
 *
 * Rows written by an invoice, bill, payment or expense are owned by that
 * document and are not editable here — changing the figure in the ledger
 * without changing the document would put the two out of step permanently.
 */
export async function updateTransactionAction(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { organization, user } = await requirePermission('transactions.edit');

    const parsed = transactionSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the details.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;
    const toAccountId = data.type === 'TRANSFER' ? (data.toAccountId ?? null) : null;

    const existing = await db.transaction.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: {
        id: true,
        type: true,
        amount: true,
        accountId: true,
        toAccountId: true,
        invoiceId: true,
        billId: true,
        expenseId: true,
        paymentId: true,
      },
    });
    if (!existing) return actionError('That entry no longer exists.');
    if (
      existing.invoiceId ||
      existing.billId ||
      existing.expenseId ||
      existing.paymentId
    ) {
      return actionError(
        'This entry belongs to a document. Change it there and the ledger follows.',
      );
    }

    const accounts = await ownedAccounts(
      organization.id,
      [data.accountId, toAccountId].filter((id): id is string => Boolean(id)),
    );
    if (!accounts.has(data.accountId)) {
      return actionError('That account no longer exists.', 'accountId');
    }
    if (toAccountId && !accounts.has(toAccountId)) {
      return actionError('That destination account no longer exists.', 'toAccountId');
    }

    await db.$transaction(async (tx) => {
      // Back the old figures out of the balances before applying the new ones,
      // so a change of account or amount cannot leave either one adrift.
      await applyToBalances(
        tx,
        {
          type: existing.type,
          accountId: existing.accountId,
          toAccountId: existing.toAccountId,
          amount: Math.abs(toNumber(existing.amount)),
        },
        -1,
      );

      await tx.transaction.update({
        where: { id },
        data: {
          accountId: data.accountId,
          toAccountId,
          type: data.type,
          amount: signedAmount(data),
          description: data.description,
          category: data.category || null,
          occurredAt: new Date(data.occurredAt),
          reference: data.reference || null,
        },
      });

      await applyToBalances(
        tx,
        { type: data.type, accountId: data.accountId, toAccountId, amount: data.amount },
        1,
      );
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'transaction',
      entityId: id,
      summary: `Updated ledger entry: ${data.description}`,
    });

    revalidatePath('/transactions');
    revalidatePath('/income');
    revalidatePath('/accounts');
    return actionOk({ id });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function deleteTransactionAction(id: string): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('transactions.delete');

    const existing = await db.transaction.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        accountId: true,
        toAccountId: true,
        invoiceId: true,
        billId: true,
        expenseId: true,
        paymentId: true,
      },
    });
    if (!existing) return actionError('That entry no longer exists.');
    if (
      existing.invoiceId ||
      existing.billId ||
      existing.expenseId ||
      existing.paymentId
    ) {
      return actionError(
        'This entry belongs to a document. Reverse it there, so both stay in step.',
      );
    }

    await db.$transaction(async (tx) => {
      await applyToBalances(
        tx,
        {
          type: existing.type,
          accountId: existing.accountId,
          toAccountId: existing.toAccountId,
          amount: Math.abs(toNumber(existing.amount)),
        },
        -1,
      );

      await tx.transaction.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'delete',
      entityType: 'transaction',
      entityId: id,
      summary: `Removed ledger entry: ${existing.description}`,
    });

    revalidatePath('/transactions');
    revalidatePath('/income');
    revalidatePath('/accounts');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}
