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
import type { ProjectStatus } from '@/generated/prisma/enums';

const SORTABLE: Record<string, Prisma.ProjectOrderByWithRelationInput> = {
  name: { name: 'asc' },
  code: { code: 'asc' },
  startDate: { startDate: 'desc' },
  budget: { budget: 'desc' },
  progress: { progress: 'desc' },
  status: { status: 'asc' },
};

/** Statuses where work is still expected to happen. */
export const OPEN_STATUSES: ProjectStatus[] = ['PLANNING', 'ACTIVE', 'ON_HOLD'];

export function projectWhere(
  organizationId: string,
  query: ListQuery,
): Prisma.ProjectWhereInput {
  const term = query.q.trim();
  const { status, customerId } = query.filters;

  return {
    organizationId,
    deletedAt: null,
    ...(status === 'open'
      ? { status: { in: OPEN_STATUSES } }
      : status
        ? { status: status as ProjectStatus }
        : {}),
    ...(customerId ? { customerId } : {}),
    ...(term
      ? {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { code: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
            { customer: { name: { contains: term, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };
}

export type ProjectListRow = {
  id: string;
  code: string;
  name: string;
  status: string;
  customerName: string | null;
  startDate: Date;
  endDate: Date | null;
  budget: number;
  spent: number;
  progress: number;
  openTasks: number;
  totalTasks: number;
  hours: number;
  /** True when the end date has passed and the work has not finished. */
  isLate: boolean;
};

export async function listProjects(organizationId: string, query: ListQuery) {
  const where = projectWhere(organizationId, query);
  const now = new Date();

  const [projects, count, totals] = await Promise.all([
    db.project.findMany({
      where,
      orderBy: orderByFor(query, SORTABLE, { startDate: 'desc' }),
      ...paginationFor(query),
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        startDate: true,
        endDate: true,
        budget: true,
        spent: true,
        progress: true,
        customer: { select: { name: true, companyName: true } },
        tasks: { where: { deletedAt: null }, select: { status: true } },
        timesheets: { select: { hours: true } },
      },
    }),
    db.project.count({ where }),
    db.project.aggregate({ where, _sum: { budget: true, spent: true } }),
  ]);

  const rows: ProjectListRow[] = projects.map((project) => ({
    id: project.id,
    code: project.code,
    name: project.name,
    status: project.status,
    customerName: project.customer?.companyName ?? project.customer?.name ?? null,
    startDate: project.startDate,
    endDate: project.endDate,
    budget: toNumber(project.budget),
    spent: toNumber(project.spent),
    progress: project.progress,
    openTasks: project.tasks.filter((task) => task.status !== 'DONE').length,
    totalTasks: project.tasks.length,
    hours: round(
      project.timesheets.reduce((total, entry) => total + toNumber(entry.hours), 0),
    ),
    isLate:
      Boolean(project.endDate) &&
      project.endDate! < now &&
      OPEN_STATUSES.includes(project.status),
  }));

  return {
    rows,
    pageInfo: pageInfo(query, count),
    summary: {
      budget: round(toNumber(totals._sum?.budget)),
      spent: round(toNumber(totals._sum?.spent)),
    },
  };
}

export async function listProjectsForExport(organizationId: string, query: ListQuery) {
  return db.project.findMany({
    where: projectWhere(organizationId, query),
    orderBy: orderByFor(query, SORTABLE, { startDate: 'desc' }),
    include: {
      customer: { select: { name: true, companyName: true } },
      _count: { select: { tasks: true, members: true } },
    },
    take: 5000,
  });
}

export async function getProject(organizationId: string, id: string) {
  return db.project.findFirst({
    where: { id, organizationId, deletedAt: null },
    include: {
      customer: { select: { id: true, name: true, companyName: true } },
      members: {
        orderBy: { joinedAt: 'asc' },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              position: true,
              employeeNumber: true,
            },
          },
        },
      },
      tasks: {
        where: { deletedAt: null },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          estimatedHours: true,
          assignee: { select: { id: true, name: true } },
        },
      },
      timesheets: {
        orderBy: { date: 'desc' },
        take: 50,
        select: {
          id: true,
          date: true,
          hours: true,
          billable: true,
          hourlyRate: true,
          description: true,
          employee: { select: { firstName: true, lastName: true } },
          task: { select: { title: true } },
        },
      },
    },
  });
}

/** Budget, spend and the shape of the book, for the page header. */
export async function projectTotals(organizationId: string) {
  const base = { organizationId, deletedAt: null };

  const [open, overBudget, hours] = await Promise.all([
    db.project.aggregate({
      where: { ...base, status: { in: OPEN_STATUSES } },
      _sum: { budget: true, spent: true },
      _count: true,
    }),
    db.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
        FROM "projects"
       WHERE "organizationId" = ${organizationId}
         AND "deletedAt" IS NULL
         AND budget > 0
         AND spent > budget`,
    db.timesheet.aggregate({
      where: { organizationId },
      _sum: { hours: true },
    }),
  ]);

  return {
    openCount: open._count,
    budget: round(toNumber(open._sum?.budget)),
    spent: round(toNumber(open._sum?.spent)),
    overBudgetCount: Number(overBudget[0]?.count ?? 0),
    hours: round(toNumber(hours._sum?.hours)),
  };
}

export async function projectOptions(organizationId: string) {
  const projects = await db.project.findMany({
    where: { organizationId, deletedAt: null, status: { in: OPEN_STATUSES } },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true },
    take: 500,
  });

  return projects.map((project) => ({
    id: project.id,
    name: project.name,
    code: project.code,
  }));
}

/**
 * The next project code, derived from the name.
 *
 * A project has a short code people say out loud, so it comes from the name
 * rather than a counter — "Harbour Fitout" becomes HARBOUR — with a numeric
 * suffix only when that is already taken.
 */
export async function suggestProjectCode(
  organizationId: string,
  name: string,
): Promise<string> {
  const base =
    name
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .split('-')[0]
      ?.slice(0, 12) || 'PROJECT';

  const taken = new Set(
    (
      await db.project.findMany({
        where: { organizationId, code: { startsWith: base } },
        select: { code: true },
      })
    ).map((project) => project.code),
  );

  if (!taken.has(base)) return base;

  for (let suffix = 2; suffix < 100; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if (!taken.has(candidate)) return candidate;
  }

  return `${base}-${Date.now().toString().slice(-4)}`;
}
