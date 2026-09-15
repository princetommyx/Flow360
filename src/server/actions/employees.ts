'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { employeeSchema } from '@/lib/validations/employee';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { logActivity } from '@/server/activity';
import { nextEmployeeNumber } from '@/server/services/employees';
import { actionError, actionOk, type ActionResult } from '@/server/actions/types';

export async function createEmployeeAction(
  input: unknown,
): Promise<ActionResult<{ id: string; employeeNumber: string }>> {
  try {
    const { organization, user } = await requirePermission('employees.create');

    const parsed = employeeSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the details.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;

    const clash = await db.employee.findFirst({
      where: { organizationId: organization.id, email: data.email, deletedAt: null },
      select: { id: true },
    });
    if (clash) {
      return actionError('Someone on your team already uses that address.', 'email');
    }

    const employee = await db.$transaction(async (tx) => {
      const employeeNumber = await nextEmployeeNumber(tx, organization.id);

      return tx.employee.create({
        data: {
          organizationId: organization.id,
          employeeNumber,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || null,
          department: data.department || null,
          position: data.position || null,
          employmentType: data.employmentType,
          status: data.status,
          hiredAt: new Date(data.hiredAt),
          terminatedAt: data.terminatedAt ? new Date(data.terminatedAt) : null,
          baseSalary: data.baseSalary,
          currency: organization.currency,
          addressLine1: data.addressLine1 || null,
          city: data.city || null,
          country: data.country || null,
          bankAccount: data.bankAccount || null,
          taxNumber: data.taxNumber || null,
          notes: data.notes || null,
        },
        select: { id: true, employeeNumber: true },
      });
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'create',
      entityType: 'employee',
      entityId: employee.id,
      summary: `Added ${data.firstName} ${data.lastName} to the team`,
    });

    revalidatePath('/employees');
    return actionOk(employee);
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function updateEmployeeAction(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { organization, user } = await requirePermission('employees.edit');

    const parsed = employeeSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the details.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;

    const existing = await db.employee.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!existing) return actionError('That person is no longer on your team.');

    const clash = await db.employee.findFirst({
      where: {
        organizationId: organization.id,
        email: data.email,
        deletedAt: null,
        NOT: { id },
      },
      select: { id: true },
    });
    if (clash) {
      return actionError('Someone else on your team already uses that address.', 'email');
    }

    await db.employee.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone || null,
        department: data.department || null,
        position: data.position || null,
        employmentType: data.employmentType,
        status: data.status,
        hiredAt: new Date(data.hiredAt),
        terminatedAt: data.terminatedAt ? new Date(data.terminatedAt) : null,
        baseSalary: data.baseSalary,
        addressLine1: data.addressLine1 || null,
        city: data.city || null,
        country: data.country || null,
        bankAccount: data.bankAccount || null,
        taxNumber: data.taxNumber || null,
        notes: data.notes || null,
      },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'employee',
      entityId: id,
      summary: `Updated ${data.firstName} ${data.lastName}`,
    });

    revalidatePath('/employees');
    revalidatePath(`/employees/${id}`);
    return actionOk({ id });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/**
 * Removing someone from the team.
 *
 * Payslips and attendance are records of what happened and are kept, so this
 * is a soft delete. Someone who has been paid is marked as having left
 * instead, which is the honest state and keeps their history reachable.
 */
export async function deleteEmployeeAction(id: string): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('employees.delete');

    const employee = await db.employee.findFirst({
      where: { id, organizationId: organization.id, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        _count: { select: { payrolls: true } },
      },
    });
    if (!employee) return actionError('That person is no longer on your team.');

    if (employee._count.payrolls > 0) {
      return actionError(
        'This person has payslips on record. Mark them as having left instead, so their history stays.',
      );
    }

    await db.employee.update({ where: { id }, data: { deletedAt: new Date() } });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'delete',
      entityType: 'employee',
      entityId: id,
      summary: `Removed ${employee.firstName} ${employee.lastName} from the team`,
    });

    revalidatePath('/employees');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}
