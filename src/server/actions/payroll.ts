'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { calculatePayslip, toNumber } from '@/lib/money';
import { payrollSchema } from '@/lib/validations/employee';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { logActivity } from '@/server/activity';
import { nextDocumentNumber } from '@/server/numbering';
import { EDITABLE_STATUSES } from '@/server/services/payroll';
import { actionError, actionOk, type ActionResult } from '@/server/actions/types';

export async function createPayrollAction(
  input: unknown,
  options?: { approve?: boolean },
): Promise<ActionResult<{ id: string; number: string }>> {
  try {
    const { organization, user } = await requirePermission('payroll.create');

    const parsed = payrollSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the payslip.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;

    const employee = await db.employee.findFirst({
      where: { id: data.employeeId, organizationId: organization.id, deletedAt: null },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!employee) return actionError('That person is not on your team.', 'employeeId');

    const periodStart = new Date(data.periodStart);
    const periodEnd = new Date(data.periodEnd);

    // One payslip per person per period: the database enforces it, but saying
    // so here is far more useful than a constraint violation.
    const clash = await db.payroll.findFirst({
      where: { employeeId: employee.id, periodStart, periodEnd },
      select: { id: true, number: true },
    });
    if (clash) {
      return actionError(
        `${employee.firstName} already has payslip ${clash.number} for that period.`,
        'periodStart',
      );
    }

    const totals = calculatePayslip(data);

    const payroll = await db.$transaction(async (tx) => {
      const number = await nextDocumentNumber(tx, organization.id, 'payroll', {
        date: periodEnd,
      });

      return tx.payroll.create({
        data: {
          organizationId: organization.id,
          employeeId: employee.id,
          number,
          periodStart,
          periodEnd,
          baseSalary: data.baseSalary,
          allowances: data.allowances,
          overtime: data.overtime,
          bonus: data.bonus,
          taxDeduction: data.taxDeduction,
          otherDeduction: data.otherDeduction,
          netSalary: totals.net,
          currency: organization.currency,
          status: options?.approve ? 'APPROVED' : 'DRAFT',
          notes: data.notes || null,
        },
        select: { id: true, number: true },
      });
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'create',
      entityType: 'payroll',
      entityId: payroll.id,
      summary: `Prepared payslip ${payroll.number} for ${employee.firstName} ${employee.lastName}`,
      metadata: { net: totals.net },
    });

    revalidatePath('/payroll');
    return actionOk(payroll);
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function updatePayrollAction(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { organization, user } = await requirePermission('payroll.edit');

    const parsed = payrollSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the payslip.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;

    const existing = await db.payroll.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: { id: true, number: true, status: true, employeeId: true },
    });
    if (!existing) return actionError('That payslip no longer exists.');
    if (!EDITABLE_STATUSES.includes(existing.status)) {
      return actionError(
        'Only draft payslips can be changed. Cancel this one and prepare another if the figures were wrong.',
      );
    }

    const totals = calculatePayslip(data);

    await db.payroll.update({
      where: { id },
      data: {
        periodStart: new Date(data.periodStart),
        periodEnd: new Date(data.periodEnd),
        baseSalary: data.baseSalary,
        allowances: data.allowances,
        overtime: data.overtime,
        bonus: data.bonus,
        taxDeduction: data.taxDeduction,
        otherDeduction: data.otherDeduction,
        netSalary: totals.net,
        notes: data.notes || null,
      },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'payroll',
      entityId: id,
      summary: `Updated payslip ${existing.number}`,
      metadata: { net: totals.net },
    });

    revalidatePath('/payroll');
    revalidatePath(`/payroll/${id}`);
    return actionOk({ id });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function approvePayrollAction(id: string): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('payroll.edit');

    const payroll = await db.payroll.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: { id: true, number: true, status: true },
    });
    if (!payroll) return actionError('That payslip no longer exists.');
    if (payroll.status !== 'DRAFT') return actionError('This payslip is already approved.');

    await db.payroll.update({ where: { id }, data: { status: 'APPROVED' } });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'payroll',
      entityId: id,
      summary: `Approved payslip ${payroll.number}`,
    });

    revalidatePath('/payroll');
    revalidatePath(`/payroll/${id}`);
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/**
 * Paying a payslip.
 *
 * Wages are real money leaving a real account, so this writes the same shape
 * as any other payment out: an expense transaction on the account it left and
 * the balance down by the net figure, in one database transaction with the
 * payslip itself.
 */
export async function payPayrollAction(
  id: string,
  input: { accountId: string; paidAt: string },
): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('payroll.edit');

    if (!input?.accountId) return actionError('Choose the account to pay from.');
    const paidAt = new Date(input.paidAt);
    if (Number.isNaN(paidAt.getTime())) return actionError('Choose a date.');

    const result = await db.$transaction(async (tx) => {
      const payroll = await tx.payroll.findFirst({
        where: { id, organizationId: organization.id, deletedAt: null },
        select: {
          id: true,
          number: true,
          status: true,
          netSalary: true,
          employee: { select: { firstName: true, lastName: true } },
        },
      });
      if (!payroll) return { ok: false as const, error: 'That payslip no longer exists.' };
      if (payroll.status === 'PAID') {
        return { ok: false as const, error: 'This payslip has already been paid.' };
      }
      if (payroll.status !== 'APPROVED') {
        return { ok: false as const, error: 'Approve the payslip before paying it.' };
      }

      const account = await tx.account.findFirst({
        where: { id: input.accountId, organizationId: organization.id, deletedAt: null },
        select: { id: true, name: true },
      });
      if (!account) return { ok: false as const, error: 'That account no longer exists.' };

      const net = toNumber(payroll.netSalary);

      await tx.payroll.update({
        where: { id },
        data: { status: 'PAID', paidAt },
      });

      await tx.transaction.create({
        data: {
          organizationId: organization.id,
          accountId: account.id,
          type: 'EXPENSE',
          // Signed relative to the account it left, like the rest of the ledger.
          amount: -net,
          currency: organization.currency,
          description: `Wages for ${payroll.employee.firstName} ${payroll.employee.lastName} (${payroll.number})`,
          category: 'Payroll',
          occurredAt: paidAt,
          reference: payroll.number,
          createdById: user.id,
        },
      });

      await tx.account.update({
        where: { id: account.id },
        data: { currentBalance: { decrement: net } },
      });

      return { ok: true as const, payroll, net };
    });

    if (!result.ok) return actionError(result.error);

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'payment',
      entityType: 'payroll',
      entityId: id,
      summary: `Paid ${result.net} on payslip ${result.payroll.number}`,
    });

    revalidatePath('/payroll');
    revalidatePath(`/payroll/${id}`);
    revalidatePath('/accounts');
    revalidatePath('/transactions');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function cancelPayrollAction(id: string): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('payroll.edit');

    const payroll = await db.payroll.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: { id: true, number: true, status: true },
    });
    if (!payroll) return actionError('That payslip no longer exists.');
    if (payroll.status === 'PAID') {
      return actionError(
        'This payslip has been paid, so it cannot be cancelled. Reverse the payment in the ledger first.',
      );
    }

    await db.payroll.update({ where: { id }, data: { status: 'CANCELLED' } });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'payroll',
      entityId: id,
      summary: `Cancelled payslip ${payroll.number}`,
    });

    revalidatePath('/payroll');
    revalidatePath(`/payroll/${id}`);
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function deletePayrollAction(id: string): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('payroll.delete');

    const payroll = await db.payroll.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: { id: true, number: true, status: true },
    });
    if (!payroll) return actionError('That payslip no longer exists.');
    if (payroll.status === 'PAID') {
      return actionError(
        'This payslip has been paid, so deleting it would lose the record. Leave it as it is.',
      );
    }

    await db.payroll.update({ where: { id }, data: { deletedAt: new Date() } });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'delete',
      entityType: 'payroll',
      entityId: id,
      summary: `Deleted payslip ${payroll.number}`,
    });

    revalidatePath('/payroll');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}
