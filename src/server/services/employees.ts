import 'server-only';

import { db } from '@/lib/db';
import { round, toNumber } from '@/lib/money';
import {
  orderByFor,
  paginationFor,
  pageInfo,
  type ListQuery,
} from '@/lib/query';
import type { Prisma } from '@/generated/prisma/client';
import type { EmploymentStatus, EmploymentType } from '@/generated/prisma/enums';

const SORTABLE: Record<string, Prisma.EmployeeOrderByWithRelationInput> = {
  name: { firstName: 'asc' },
  employeeNumber: { employeeNumber: 'asc' },
  hiredAt: { hiredAt: 'desc' },
  baseSalary: { baseSalary: 'desc' },
  department: { department: 'asc' },
  status: { status: 'asc' },
};

/** Statuses that count as someone still on the books. */
export const ON_BOOKS: EmploymentStatus[] = ['ACTIVE', 'PROBATION', 'ON_LEAVE'];

export function employeeWhere(
  organizationId: string,
  query: ListQuery,
): Prisma.EmployeeWhereInput {
  const term = query.q.trim();
  const { status, department, employmentType } = query.filters;

  return {
    organizationId,
    deletedAt: null,
    ...(status === 'current'
      ? { status: { in: ON_BOOKS } }
      : status
        ? { status: status as EmploymentStatus }
        : {}),
    ...(department ? { department } : {}),
    ...(employmentType ? { employmentType: employmentType as EmploymentType } : {}),
    ...(term
      ? {
          OR: [
            { firstName: { contains: term, mode: 'insensitive' } },
            { lastName: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
            { employeeNumber: { contains: term, mode: 'insensitive' } },
            { position: { contains: term, mode: 'insensitive' } },
            { department: { contains: term, mode: 'insensitive' } },
          ],
        }
      : {}),
  };
}

export type EmployeeListRow = {
  id: string;
  employeeNumber: string;
  name: string;
  email: string;
  phone: string | null;
  department: string | null;
  position: string | null;
  employmentType: string;
  status: string;
  hiredAt: Date;
  baseSalary: number;
};

export async function listEmployees(organizationId: string, query: ListQuery) {
  const where = employeeWhere(organizationId, query);

  const [employees, count, payroll] = await Promise.all([
    db.employee.findMany({
      where,
      orderBy: orderByFor(query, SORTABLE, { firstName: 'asc' }),
      ...paginationFor(query),
      select: {
        id: true,
        employeeNumber: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        department: true,
        position: true,
        employmentType: true,
        status: true,
        hiredAt: true,
        baseSalary: true,
      },
    }),
    db.employee.count({ where }),
    db.employee.aggregate({ where, _sum: { baseSalary: true } }),
  ]);

  const rows: EmployeeListRow[] = employees.map((employee) => ({
    id: employee.id,
    employeeNumber: employee.employeeNumber,
    name: `${employee.firstName} ${employee.lastName}`,
    email: employee.email,
    phone: employee.phone,
    department: employee.department,
    position: employee.position,
    employmentType: employee.employmentType,
    status: employee.status,
    hiredAt: employee.hiredAt,
    baseSalary: toNumber(employee.baseSalary),
  }));

  return {
    rows,
    pageInfo: pageInfo(query, count),
    summary: { salaryBill: round(toNumber(payroll._sum?.baseSalary)) },
  };
}

export async function listEmployeesForExport(
  organizationId: string,
  query: ListQuery,
) {
  return db.employee.findMany({
    where: employeeWhere(organizationId, query),
    orderBy: orderByFor(query, SORTABLE, { firstName: 'asc' }),
    take: 5000,
  });
}

export async function getEmployee(organizationId: string, id: string) {
  return db.employee.findFirst({
    where: { id, organizationId, deletedAt: null },
    include: {
      payrolls: {
        where: { deletedAt: null },
        orderBy: { periodStart: 'desc' },
        take: 12,
        select: {
          id: true,
          number: true,
          periodStart: true,
          periodEnd: true,
          netSalary: true,
          status: true,
        },
      },
      attendances: {
        orderBy: { date: 'desc' },
        take: 30,
        select: {
          id: true,
          date: true,
          status: true,
          checkIn: true,
          checkOut: true,
          hoursWorked: true,
        },
      },
    },
  });
}

/** Headcount and the monthly salary bill, for the page header. */
export async function employeeTotals(organizationId: string) {
  const base = { organizationId, deletedAt: null };

  const [current, onLeave, starters, bill] = await Promise.all([
    db.employee.count({ where: { ...base, status: { in: ON_BOOKS } } }),
    db.employee.count({ where: { ...base, status: 'ON_LEAVE' } }),
    db.employee.count({
      where: {
        ...base,
        hiredAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
    db.employee.aggregate({
      where: { ...base, status: { in: ON_BOOKS } },
      _sum: { baseSalary: true },
    }),
  ]);

  return {
    headcount: current,
    onLeave,
    startedThisMonth: starters,
    salaryBill: round(toNumber(bill._sum?.baseSalary)),
  };
}

export async function departmentOptions(organizationId: string) {
  const rows = await db.employee.findMany({
    where: { organizationId, deletedAt: null, department: { not: null } },
    distinct: ['department'],
    orderBy: { department: 'asc' },
    select: { department: true },
    take: 200,
  });

  return rows
    .map((row) => row.department)
    .filter((department): department is string => Boolean(department));
}

export async function employeeOptions(organizationId: string) {
  const employees = await db.employee.findMany({
    where: { organizationId, deletedAt: null, status: { in: ON_BOOKS } },
    orderBy: { firstName: 'asc' },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      employeeNumber: true,
      baseSalary: true,
      position: true,
    },
    take: 1000,
  });

  return employees.map((employee) => ({
    id: employee.id,
    name: `${employee.firstName} ${employee.lastName}`,
    employeeNumber: employee.employeeNumber,
    baseSalary: toNumber(employee.baseSalary),
    position: employee.position,
  }));
}

/**
 * The next employee number for an organization.
 *
 * Employees do not go through `NumberSequence` — they are not documents and
 * their numbering is not configurable — so the next one is derived from the
 * highest already taken, inside the caller's transaction.
 */
export async function nextEmployeeNumber(
  tx: Prisma.TransactionClient,
  organizationId: string,
): Promise<string> {
  // The numeric maximum, not the lexicographic one: EMP-005 sorts above
  // EMP-0006 as text, so a workspace holding two widths — an import, an older
  // seed — would hand out a number that is already taken.
  const existing = await tx.employee.findMany({
    where: { organizationId, employeeNumber: { startsWith: 'EMP-' } },
    select: { employeeNumber: true },
  });

  const highest = existing.reduce((max, employee) => {
    const value = Number(employee.employeeNumber.slice(4));
    return Number.isFinite(value) && value > max ? value : max;
  }, 0);

  return `EMP-${String(highest + 1).padStart(4, '0')}`;
}
