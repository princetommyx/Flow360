import 'server-only';

import { db } from '@/lib/db';
import { round, toNumber } from '@/lib/money';

import type { AttendanceStatus } from '@/generated/prisma/enums';

import { ON_BOOKS } from './employees';

/** The register treats the day as a whole, so times are stored against midnight. */
export function dayBounds(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export type RegisterRow = {
  employeeId: string;
  name: string;
  employeeNumber: string;
  position: string | null;
  department: string | null;
  attendanceId: string | null;
  status: AttendanceStatus | null;
  checkIn: string | null;
  checkOut: string | null;
  hoursWorked: number;
  notes: string | null;
};

/**
 * Everyone on the books for one day, with whatever has been recorded.
 *
 * Built from the employee list rather than from the attendance table, so a day
 * nobody has touched still shows the whole team waiting to be marked — an
 * empty register is the normal starting state, not an error.
 */
export async function registerForDate(
  organizationId: string,
  date: Date,
  filters?: { department?: string },
): Promise<RegisterRow[]> {
  const { start, end } = dayBounds(date);

  const [employees, records] = await Promise.all([
    db.employee.findMany({
      where: {
        organizationId,
        deletedAt: null,
        status: { in: ON_BOOKS },
        ...(filters?.department ? { department: filters.department } : {}),
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        employeeNumber: true,
        position: true,
        department: true,
      },
      take: 1000,
    }),
    db.attendance.findMany({
      where: { organizationId, date: { gte: start, lte: end } },
      select: {
        id: true,
        employeeId: true,
        status: true,
        checkIn: true,
        checkOut: true,
        hoursWorked: true,
        notes: true,
      },
    }),
  ]);

  const byEmployee = new Map(records.map((record) => [record.employeeId, record]));

  return employees.map((employee) => {
    const record = byEmployee.get(employee.id);
    return {
      employeeId: employee.id,
      name: `${employee.firstName} ${employee.lastName}`,
      employeeNumber: employee.employeeNumber,
      position: employee.position,
      department: employee.department,
      attendanceId: record?.id ?? null,
      status: record?.status ?? null,
      checkIn: record?.checkIn ? toTimeInput(record.checkIn) : null,
      checkOut: record?.checkOut ? toTimeInput(record.checkOut) : null,
      hoursWorked: record ? toNumber(record.hoursWorked) : 0,
      notes: record?.notes ?? null,
    };
  });
}

/** `HH:mm` for a time input, in the same reading the register wrote. */
function toTimeInput(value: Date): string {
  return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
}

export type AttendanceSummary = {
  present: number;
  late: number;
  absent: number;
  onLeave: number;
  unmarked: number;
  hours: number;
};

export function summarise(rows: RegisterRow[]): AttendanceSummary {
  return {
    present: rows.filter((row) => row.status === 'PRESENT').length,
    late: rows.filter((row) => row.status === 'LATE').length,
    absent: rows.filter((row) => row.status === 'ABSENT').length,
    onLeave: rows.filter((row) => row.status === 'LEAVE' || row.status === 'HOLIDAY')
      .length,
    unmarked: rows.filter((row) => row.status === null).length,
    hours: round(rows.reduce((total, row) => total + row.hoursWorked, 0)),
  };
}

/** Hours and days by person over a period, for the month view and exports. */
export async function attendanceTotals(
  organizationId: string,
  from: Date,
  to: Date,
  filters?: { employeeId?: string },
) {
  const rows = await db.attendance.groupBy({
    by: ['employeeId', 'status'],
    where: {
      organizationId,
      date: { gte: from, lte: to },
      ...(filters?.employeeId ? { employeeId: filters.employeeId } : {}),
    },
    _count: true,
    _sum: { hoursWorked: true },
  });

  const employees = await db.employee.findMany({
    where: { organizationId, deletedAt: null },
    select: { id: true, firstName: true, lastName: true, employeeNumber: true },
  });

  const byId = new Map(
    employees.map((employee) => [
      employee.id,
      {
        name: `${employee.firstName} ${employee.lastName}`,
        employeeNumber: employee.employeeNumber,
      },
    ]),
  );

  const totals = new Map<
    string,
    { name: string; employeeNumber: string; days: number; absent: number; hours: number }
  >();

  for (const row of rows) {
    const person = byId.get(row.employeeId);
    if (!person) continue;

    const current =
      totals.get(row.employeeId) ??
      { ...person, days: 0, absent: 0, hours: 0 };

    if (row.status === 'ABSENT') current.absent += row._count;
    else current.days += row._count;
    current.hours = round(current.hours + toNumber(row._sum.hoursWorked));

    totals.set(row.employeeId, current);
  }

  return Array.from(totals.values()).sort((a, b) => b.hours - a.hours);
}

export async function listAttendanceForExport(
  organizationId: string,
  from: Date,
  to: Date,
) {
  return db.attendance.findMany({
    where: { organizationId, date: { gte: from, lte: to } },
    orderBy: [{ date: 'desc' }, { employeeId: 'asc' }],
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
          employeeNumber: true,
          department: true,
        },
      },
    },
    take: 10_000,
  });
}

