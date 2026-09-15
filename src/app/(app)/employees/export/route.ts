import { csvResponse, exportFilename, toCsv } from '@/lib/csv';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { listEmployeesForExport } from '@/server/services/employees';
import { toNumber } from '@/lib/money';

export async function GET(request: Request) {
  try {
    const context = await requirePermission('employees.export');

    const url = new URL(request.url);
    const params: SearchParams = Object.fromEntries(url.searchParams.entries());
    const query = parseListQuery(params, { sort: 'name', dir: 'asc' });

    const employees = await listEmployeesForExport(context.organization.id, query);

    const csv = toCsv(employees, [
      { header: 'Number', value: (row) => row.employeeNumber },
      { header: 'First name', value: (row) => row.firstName },
      { header: 'Last name', value: (row) => row.lastName },
      { header: 'Email', value: (row) => row.email },
      { header: 'Phone', value: (row) => row.phone ?? '' },
      { header: 'Role', value: (row) => row.position ?? '' },
      { header: 'Department', value: (row) => row.department ?? '' },
      { header: 'Employment', value: (row) => row.employmentType },
      { header: 'Status', value: (row) => row.status },
      { header: 'Started', value: (row) => row.hiredAt.toISOString().slice(0, 10) },
      {
        header: 'Left',
        value: (row) => row.terminatedAt?.toISOString().slice(0, 10) ?? '',
      },
      { header: 'Base pay', value: (row) => toNumber(row.baseSalary) },
      { header: 'Currency', value: (row) => row.currency },
    ]);

    return csvResponse(csv, exportFilename('employees'));
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return new Response('Forbidden', { status: 403 });
    }
    throw error;
  }
}
