import { csvResponse, exportFilename, toCsv } from '@/lib/csv';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { listProjectsForExport } from '@/server/services/projects';
import { toNumber } from '@/lib/money';

export async function GET(request: Request) {
  try {
    const context = await requirePermission('projects.export');

    const url = new URL(request.url);
    const params: SearchParams = Object.fromEntries(url.searchParams.entries());
    const query = parseListQuery(params, { sort: 'startDate', dir: 'desc' });

    const projects = await listProjectsForExport(context.organization.id, query);

    const csv = toCsv(projects, [
      { header: 'Code', value: (row) => row.code },
      { header: 'Name', value: (row) => row.name },
      {
        header: 'Customer',
        value: (row) => row.customer?.companyName ?? row.customer?.name ?? '',
      },
      { header: 'Status', value: (row) => row.status },
      { header: 'Starts', value: (row) => row.startDate.toISOString().slice(0, 10) },
      { header: 'Due', value: (row) => row.endDate?.toISOString().slice(0, 10) ?? '' },
      { header: 'Budget', value: (row) => toNumber(row.budget) },
      { header: 'Spent', value: (row) => toNumber(row.spent) },
      { header: 'Progress %', value: (row) => row.progress },
      { header: 'Tasks', value: (row) => row._count.tasks },
      { header: 'Team', value: (row) => row._count.members },
      { header: 'Currency', value: (row) => row.currency },
    ]);

    return csvResponse(csv, exportFilename('projects'));
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return new Response('Forbidden', { status: 403 });
    }
    throw error;
  }
}
