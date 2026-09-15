import { csvResponse, exportFilename, toCsv } from '@/lib/csv';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { db } from '@/lib/db';
import { round, toNumber } from '@/lib/money';

export async function GET(request: Request) {
  try {
    const context = await requirePermission('timesheets.export');

    const url = new URL(request.url);
    const params: SearchParams = Object.fromEntries(url.searchParams.entries());
    const query = parseListQuery(params, { sort: 'date', dir: 'desc' });
    const { projectId, billable } = query.filters;

    const rows = await db.timesheet.findMany({
      where: {
        organizationId: context.organization.id,
        ...(projectId ? { projectId } : {}),
        ...(billable ? { billable: billable === 'yes' } : {}),
      },
      orderBy: { date: 'desc' },
      include: {
        project: { select: { code: true, name: true } },
        task: { select: { title: true } },
        employee: { select: { firstName: true, lastName: true } },
      },
      take: 10_000,
    });

    const csv = toCsv(rows, [
      { header: 'Date', value: (row) => row.date.toISOString().slice(0, 10) },
      { header: 'Project code', value: (row) => row.project.code },
      { header: 'Project', value: (row) => row.project.name },
      { header: 'Task', value: (row) => row.task?.title ?? '' },
      {
        header: 'Person',
        value: (row) =>
          row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : '',
      },
      { header: 'Hours', value: (row) => toNumber(row.hours) },
      { header: 'Billable', value: (row) => (row.billable ? 'Yes' : 'No') },
      { header: 'Rate', value: (row) => (row.hourlyRate ? toNumber(row.hourlyRate) : '') },
      {
        header: 'Value',
        value: (row) =>
          row.billable && row.hourlyRate
            ? round(toNumber(row.hours) * toNumber(row.hourlyRate))
            : '',
      },
      { header: 'Notes', value: (row) => row.description ?? '' },
    ]);

    return csvResponse(csv, exportFilename('timesheets'));
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return new Response('Forbidden', { status: 403 });
    }
    throw error;
  }
}
