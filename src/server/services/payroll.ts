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
import type { PayrollStatus } from '@/generated/prisma/enums';

const SORTABLE: Record<string, Prisma.PayrollOrderByWithRelationInput> = {
  number: { number: 'asc' },
  periodStart: { periodStart: 'desc' },
  netSalary: { netSalary: 'desc' },
  status: { status: 'asc' },
};

/** A payslip can only be rewritten while it is still a draft. */
export const EDITABLE_STATUSES: PayrollStatus[] = ['DRAFT'];

export function payrollWhere(
  organizationId: string,
  query: ListQuery,
): Prisma.PayrollWhereInput {
  const term = query.q.trim();
  const { status, employeeId, period } = query.filters;

  return {
    organizationId,
    deletedAt: null,
    ...(status === 'unpaid'
      ? { status: { in: ['DRAFT', 'APPROVED'] } }
      : status
        ? { status: status as PayrollStatus }
        : {}),
    ...(employeeId ? { employeeId } : {}),
    ...(period ? { periodStart: { gte: new Date(`${period}-01`) } } : {}),
    ...(term
      ? {
          OR: [
            { number: { contains: term, mode: 'insensitive' } },
            { employee: { firstName: { contains: term, mode: 'insensitive' } } },
            { employee: { lastName: { contains: term, mode: 'insensitive' } } },
            { employee: { employeeNumber: { contains: term, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };
}

export type PayrollListRow = {
  id: string;
  number: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  periodStart: Date;
  periodEnd: Date;
  gross: number;
  deductions: number;
  netSalary: number;
  status: string;
  paidAt: Date | null;
};

export async function listPayroll(organizationId: string, query: ListQuery) {
  const where = payrollWhere(organizationId, query);

  const [payrolls, count, totals] = await Promise.all([
    db.payroll.findMany({
      where,
      orderBy: orderByFor(query, SORTABLE, { periodStart: 'desc' }),
      ...paginationFor(query),
      select: {
        id: true,
        number: true,
        employeeId: true,
        periodStart: true,
        periodEnd: true,
        baseSalary: true,
        allowances: true,
        overtime: true,
        bonus: true,
        taxDeduction: true,
        otherDeduction: true,
        netSalary: true,
        status: true,
        paidAt: true,
        employee: {
          select: { firstName: true, lastName: true, employeeNumber: true },
        },
      },
    }),
    db.payroll.count({ where }),
    db.payroll.aggregate({ where, _sum: { netSalary: true } }),
  ]);

  const rows: PayrollListRow[] = payrolls.map((payroll) => ({
    id: payroll.id,
    number: payroll.number,
    employeeId: payroll.employeeId,
    employeeName: `${payroll.employee.firstName} ${payroll.employee.lastName}`,
    employeeNumber: payroll.employee.employeeNumber,
    periodStart: payroll.periodStart,
    periodEnd: payroll.periodEnd,
    gross: round(
      toNumber(payroll.baseSalary) +
        toNumber(payroll.allowances) +
        toNumber(payroll.overtime) +
        toNumber(payroll.bonus),
    ),
    deductions: round(
      toNumber(payroll.taxDeduction) + toNumber(payroll.otherDeduction),
    ),
    netSalary: toNumber(payroll.netSalary),
    status: payroll.status,
    paidAt: payroll.paidAt,
  }));

  return {
    rows,
    pageInfo: pageInfo(query, count),
    summary: { net: round(toNumber(totals._sum?.netSalary)) },
  };
}

export async function listPayrollForExport(organizationId: string, query: ListQuery) {
  return db.payroll.findMany({
    where: payrollWhere(organizationId, query),
    orderBy: orderByFor(query, SORTABLE, { periodStart: 'desc' }),
    include: {
      employee: {
        select: { firstName: true, lastName: true, employeeNumber: true, department: true },
      },
    },
    take: 5000,
  });
}

export async function getPayroll(organizationId: string, id: string) {
  return db.payroll.findFirst({
    where: { id, organizationId, deletedAt: null },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeNumber: true,
          email: true,
          position: true,
          department: true,
          bankAccount: true,
          taxNumber: true,
        },
      },
    },
  });
}

/** What is waiting to be paid, and what has been, for the page header. */
export async function payrollTotals(organizationId: string, now = new Date()) {
  const base = { organizationId, deletedAt: null };
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [pending, paidThisMonth, drafts] = await Promise.all([
    db.payroll.aggregate({
      where: { ...base, status: 'APPROVED' },
      _sum: { netSalary: true },
      _count: true,
    }),
    db.payroll.aggregate({
      where: { ...base, status: 'PAID', paidAt: { gte: startOfMonth } },
      _sum: { netSalary: true },
      _count: true,
    }),
    db.payroll.count({ where: { ...base, status: 'DRAFT' } }),
  ]);

  return {
    pending: round(toNumber(pending._sum?.netSalary)),
    pendingCount: pending._count,
    paidThisMonth: round(toNumber(paidThisMonth._sum?.netSalary)),
    paidCount: paidThisMonth._count,
    draftCount: drafts,
  };
}
