import type { Metadata } from 'next';

import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/page-header';
import { ExportButton } from '@/components/shared/export-button';
import { CountUp } from '@/components/shared/count-up';
import { db } from '@/lib/db';
import { hasPermission } from '@/lib/permissions';
import { round, toNumber } from '@/lib/money';
import {
  orderByFor,
  paginationFor,
  pageInfo,
  parseListQuery,
  type SearchParams,
} from '@/lib/query';
import { requirePermission } from '@/server/tenant';
import { projectOptions } from '@/server/services/projects';
import { employeeOptions } from '@/server/services/employees';
import type { Prisma } from '@/generated/prisma/client';

import { TimesheetsTable, type TimesheetRow } from './timesheets-table';

export const metadata: Metadata = { title: 'Timesheets' };

const SORTABLE: Record<string, Prisma.TimesheetOrderByWithRelationInput> = {
  date: { date: 'desc' },
  hours: { hours: 'desc' },
};

export default async function TimesheetsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const context = await requirePermission('timesheets.view');

  const query = parseListQuery(params, { sort: 'date', dir: 'desc' });
  const term = query.q.trim();
  const { projectId, billable } = query.filters;

  const where: Prisma.TimesheetWhereInput = {
    organizationId: context.organization.id,
    ...(projectId ? { projectId } : {}),
    ...(billable ? { billable: billable === 'yes' } : {}),
    ...(term
      ? {
          OR: [
            { description: { contains: term, mode: 'insensitive' } },
            { project: { name: { contains: term, mode: 'insensitive' } } },
            { project: { code: { contains: term, mode: 'insensitive' } } },
            { task: { title: { contains: term, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);

  const [entries, count, totals, thisWeek, projects, employees, tasks] =
    await Promise.all([
      db.timesheet.findMany({
        where,
        orderBy: orderByFor(query, SORTABLE, { date: 'desc' }),
        ...paginationFor(query),
        select: {
          id: true,
          projectId: true,
          taskId: true,
          employeeId: true,
          date: true,
          hours: true,
          description: true,
          billable: true,
          hourlyRate: true,
          project: { select: { code: true, name: true } },
          task: { select: { title: true } },
          employee: { select: { firstName: true, lastName: true } },
        },
      }),
      db.timesheet.count({ where }),
      db.timesheet.aggregate({ where, _sum: { hours: true } }),
      db.timesheet.aggregate({
        where: { organizationId: context.organization.id, date: { gte: weekStart } },
        _sum: { hours: true },
      }),
      projectOptions(context.organization.id),
      employeeOptions(context.organization.id),
      db.task.findMany({
        where: { organizationId: context.organization.id, deletedAt: null },
        select: { id: true, title: true, projectId: true },
        take: 1000,
      }),
    ]);

  const rows: TimesheetRow[] = entries.map((entry) => {
    const hours = toNumber(entry.hours);
    const rate = entry.hourlyRate ? toNumber(entry.hourlyRate) : null;
    return {
      id: entry.id,
      projectId: entry.projectId,
      taskId: entry.taskId,
      employeeId: entry.employeeId,
      date: entry.date,
      hours,
      description: entry.description,
      billable: entry.billable,
      hourlyRate: rate,
      projectCode: entry.project.code,
      projectName: entry.project.name,
      taskTitle: entry.task?.title ?? null,
      personName: entry.employee
        ? `${entry.employee.firstName} ${entry.employee.lastName}`
        : null,
      value: entry.billable && rate ? round(hours * rate) : 0,
    };
  });

  const can = {
    create: hasPermission(context.permissions, 'timesheets.create'),
    edit: hasPermission(context.permissions, 'timesheets.edit'),
    delete: hasPermission(context.permissions, 'timesheets.delete'),
    export: hasPermission(context.permissions, 'timesheets.export'),
  };

  const currency = context.organization.currency;
  const matching = round(toNumber(totals._sum?.hours));
  const billableValue = round(rows.reduce((total, row) => total + row.value, 0));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Timesheets"
        description="Hours booked against the work, and what they add up to."
        actions={can.export ? <ExportButton /> : null}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">This week</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={round(toNumber(thisWeek._sum?.hours))} decimals={2} />
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">Hours logged</p>
        </Card>
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">
            Matching this view
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={matching} decimals={2} />
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Across {count} entr{count === 1 ? 'y' : 'ies'}
          </p>
        </Card>
        <Card className="hover-lift p-5">
          <p className="text-[12.5px] font-medium text-muted-foreground">
            Value on this page
          </p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.02em] tabular">
            <CountUp value={billableValue} kind="currency" currency={currency} decimals={2} />
          </p>
          <p className="mt-1 text-[12px] text-muted-foreground">
            Billable hours with a rate
          </p>
        </Card>
      </div>

      <TimesheetsTable
        rows={rows}
        pageInfo={pageInfo(query, count)}
        isFiltered={Boolean(query.q) || Object.keys(query.filters).length > 0}
        currency={currency}
        can={can}
        choices={{
          projects,
          employees: employees.map((employee) => ({
            id: employee.id,
            name: employee.name,
          })),
          tasks,
        }}
      />
    </div>
  );
}
