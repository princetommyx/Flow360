'use server';

import { revalidatePath } from 'next/cache';

import { db } from '@/lib/db';
import { round } from '@/lib/money';
import { attendanceSchema } from '@/lib/validations/employee';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { logActivity } from '@/server/activity';
import { dayBounds } from '@/server/services/attendance';
import { ON_BOOKS } from '@/server/services/employees';
import { actionError, actionOk, type ActionResult } from '@/server/actions/types';

/**
 * Turns `HH:mm` on a given day into a timestamp.
 *
 * The register works in local wall-clock time, which is what someone reading a
 * clock on the wall means by "started at eight".
 */
function at(date: Date, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  const value = new Date(date);
  value.setHours(hours ?? 0, minutes ?? 0, 0, 0);
  return value;
}

/** Hours between two times on the same day, to two decimals. */
function hoursBetween(from: Date, to: Date): number {
  return round((to.getTime() - from.getTime()) / 3_600_000);
}

/**
 * Records one person's day.
 *
 * Upsert rather than create: the register is a single row per person per day,
 * and correcting it is the common case. Hours are derived whenever both times
 * are given, so the two can never disagree; a day with no times keeps whatever
 * hours were typed, which is how a paper timesheet arrives.
 */
export async function saveAttendanceAction(input: unknown): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('attendance.edit');

    const parsed = attendanceSchema.safeParse(input);
    if (!parsed.success) {
      return actionError(
        parsed.error.issues[0]?.message ?? 'Check the details.',
        parsed.error.issues[0]?.path.join('.'),
      );
    }
    const data = parsed.data;

    const employee = await db.employee.findFirst({
      where: { id: data.employeeId, organizationId: organization.id, deletedAt: null },
      select: { id: true, firstName: true, lastName: true },
    });
    if (!employee) return actionError('That person is not on your team.', 'employeeId');

    const { start } = dayBounds(new Date(data.date));
    const checkIn = data.checkIn ? at(start, data.checkIn) : null;
    const checkOut = data.checkOut ? at(start, data.checkOut) : null;

    const hoursWorked =
      checkIn && checkOut ? hoursBetween(checkIn, checkOut) : data.hoursWorked;

    await db.attendance.upsert({
      where: { employeeId_date: { employeeId: employee.id, date: start } },
      create: {
        organizationId: organization.id,
        employeeId: employee.id,
        date: start,
        status: data.status,
        checkIn,
        checkOut,
        hoursWorked,
        notes: data.notes || null,
      },
      update: {
        status: data.status,
        checkIn,
        checkOut,
        hoursWorked,
        notes: data.notes || null,
      },
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'attendance',
      entityId: employee.id,
      summary: `Marked ${employee.firstName} ${employee.lastName} ${data.status.toLowerCase().replace(/_/g, ' ')}`,
    });

    revalidatePath('/attendance');
    revalidatePath(`/employees/${employee.id}`);
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

/**
 * Marks everyone still unmarked as present for a day.
 *
 * The common case by far: most days most people turn up, and the exceptions
 * are what someone actually wants to spend time recording. Rows already marked
 * are left alone, so this cannot overwrite a decision someone made.
 */
export async function markAllPresentAction(date: string): Promise<ActionResult<{ marked: number }>> {
  try {
    const { organization, user } = await requirePermission('attendance.edit');

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return actionError('Choose a date.');

    const { start, end } = dayBounds(parsedDate);

    const [employees, existing] = await Promise.all([
      db.employee.findMany({
        where: { organizationId: organization.id, deletedAt: null, status: { in: ON_BOOKS } },
        select: { id: true },
        take: 1000,
      }),
      db.attendance.findMany({
        where: { organizationId: organization.id, date: { gte: start, lte: end } },
        select: { employeeId: true },
      }),
    ]);

    const alreadyMarked = new Set(existing.map((record) => record.employeeId));
    const missing = employees.filter((employee) => !alreadyMarked.has(employee.id));

    if (missing.length === 0) {
      return actionError('Everyone has already been marked for that day.');
    }

    await db.attendance.createMany({
      data: missing.map((employee) => ({
        organizationId: organization.id,
        employeeId: employee.id,
        date: start,
        status: 'PRESENT' as const,
        hoursWorked: 0,
      })),
    });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'update',
      entityType: 'attendance',
      entityId: organization.id,
      summary: `Marked ${missing.length} present for ${start.toISOString().slice(0, 10)}`,
    });

    revalidatePath('/attendance');
    return actionOk({ marked: missing.length });
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}

export async function clearAttendanceAction(
  employeeId: string,
  date: string,
): Promise<ActionResult> {
  try {
    const { organization, user } = await requirePermission('attendance.edit');

    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return actionError('Choose a date.');

    const { start } = dayBounds(parsedDate);

    const record = await db.attendance.findFirst({
      where: { organizationId: organization.id, employeeId, date: start },
      select: { id: true },
    });
    if (!record) return actionError('Nothing is recorded for that day.');

    await db.attendance.delete({ where: { id: record.id } });

    await logActivity({
      organizationId: organization.id,
      userId: user.id,
      action: 'delete',
      entityType: 'attendance',
      entityId: employeeId,
      summary: `Cleared attendance for ${start.toISOString().slice(0, 10)}`,
    });

    revalidatePath('/attendance');
    return actionOk();
  } catch (error) {
    if (error instanceof AuthorizationError) return actionError(error.message);
    throw error;
  }
}
