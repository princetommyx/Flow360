'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { expenseSchema } from '@/lib/validations/expense';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { logActivity } from '@/server/activity';
import { nextDocumentNumber } from '@/server/numbering';
import { actionError, actionOk, type ActionResult } from '@/server/actions/types';
import { round } from '@/lib/money';

/**
 * Checks that every id on the expense belongs to this organization.
 *
 * Ids arrive from the client, so a payload naming another tenant's category or
 * account has to miss rather than quietly attach.
 */
async function resolveRelations(
  organizationId: string,
  data: { categoryId?: string | null; supplierId?: string | null; accountId?: string | null },
): Promise<
  | { ok: true; categoryId: string | null; supplierId: string | null; accountId: string | null }
  | { ok: false; error: string; field: string }
> {
  const [category, supplier, account] = await Promise.all([
    data.categoryId
      ? db.expenseCategory.findFirst({
          where: { id: data.categoryId, organizationId, deletedAt: null },
          select: { id: true },
        })
      : null,
    data.supplierId
      ? db.supplier.findFirst({
          where: { id: data.supplierId, organizationId, deletedAt: null },
          select: { id: true },
        })
      : null,
    data.accountId
      ? db.account.findFirst({
          where: { id: data.accountId, organizationId, deletedAt: null },
          select: { id: true },
        })
      : null,
  ]);

  if (data.categoryId && !category) {
    return { ok: false, error: 'That category no longer exists.', field: 'categoryId' };
  }
  if (data.supplierId && !supplier) {
    return { ok: false, error: 'That supplier no longer exists.', field: 'supplierId' };
  }
  if (data.accountId && !account) {
    return { ok: false, error: 'That account no longer exists.', field: 'accountId' };
  }

  return {
    ok: true,
    categoryId: category?.id ?? null,
    supplierId: supplier?.id ?? null,
    accountId: account?.id ?? null,
  };
}

export async function createExpenseAction(
  input: unknown,
): Promise<ActionResult<{ id: string; number: string }>> {
  try {
    const { organization, user } = await requirePermission('expenses.create');

    const parsed = expenseSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the details entered.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;

    const relations = await resolveRelations(organization.id, data);
    if (!relations.ok) return actionError(relations.error, relations.field);

    const total = round(data.amount + data.taxAmount);

    const expense = await db.$transaction(async (tx) => {
      const number = await nextDocumentNumber(tx, organization.id, 'expense', {
        date: new Date(data.spentAt),
      });

      return tx.expense.create({
        data: {
          organizationId: organization.id,
          number,
          title: data.title,
          description: data.description || null,
          categoryId: relations.categoryId,
          supplierId: relations.supplierId,
          accountId: relations.accountId,
          vendorName: data.vendorName || null,
          amount: data.amount,
          taxAmount: data.taxAmount,
          total,
          currency: organization.currency,
          method: data.method,
          status: data.status,
          spentAt: new Date(data.spentAt),
          reference: data.reference || null,
          billable: data.billable,
          createdById: user.id,
        },
        select: { id: true, number: true },
      });
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'create',
      entityType: 'expense',
      entityId: expense.id,
      summary: `Recorded expense ${expense.number} — ${data.title}`,
      metadata: { total },
    });

    revalidatePath('/expenses');
    revalidatePath('/dashboard');
    return actionOk({ id: expense.id, number: expense.number });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function updateExpenseAction(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { organization, user } = await requirePermission('expenses.edit');

    const parsed = expenseSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the details entered.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;

    const existing = await db.expense.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: { id: true, number: true },
    });
    if (!existing) return actionError('That expense no longer exists.');

    const relations = await resolveRelations(organization.id, data);
    if (!relations.ok) return actionError(relations.error, relations.field);

    await db.expense.update({
      where: { id: existing.id },
      data: {
        title: data.title,
        description: data.description || null,
        categoryId: relations.categoryId,
        supplierId: relations.supplierId,
        accountId: relations.accountId,
        vendorName: data.vendorName || null,
        amount: data.amount,
        taxAmount: data.taxAmount,
        total: round(data.amount + data.taxAmount),
        method: data.method,
        status: data.status,
        spentAt: new Date(data.spentAt),
        reference: data.reference || null,
        billable: data.billable,
      },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'expense',
      entityId: existing.id,
      summary: `Updated expense ${existing.number}`,
    });

    revalidatePath('/expenses');
    revalidatePath(`/expenses/${existing.id}`);
    revalidatePath('/dashboard');
    return actionOk({ id: existing.id });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function deleteExpenseAction(id: string): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('expenses.delete');

    const expense = await db.expense.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: { id: true, number: true },
    });
    if (!expense) return actionError('That expense no longer exists.');

    await db.expense.update({
      where: { id: expense.id },
      data: { deletedAt: new Date() },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'delete',
      entityType: 'expense',
      entityId: expense.id,
      summary: `Deleted expense ${expense.number}`,
    });

    revalidatePath('/expenses');
    revalidatePath('/dashboard');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}
