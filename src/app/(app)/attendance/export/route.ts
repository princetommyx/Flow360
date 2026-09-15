import { csvResponse, exportFilename, toCsv } from '@/lib/csv';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { listAttendanceForExport } from '@/server/services/attendance';
import { toNumber } from '@/lib/money';

export async function GET(request: Request) {
  try {
    const context = await requirePermission('attendance.export');

    const url = new URL(request.url);
    const requested = url.searchParams.get('date');
    const anchor = requested ? new Date(requested) : new Date();
    const date = Number.isNaN(anchor.getTime()) ? new Date() : anchor;

    // The register is a month at a time, so the file is too.
    const from = new Date(date.getFullYear(), date.getMonth(), 1);
    const to = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

    const rows = await listAttendanceForExport(context.organization.id, from, to);

    const csv = toCsv(rows, [
      { header: 'Date', value: (row) => row.date.toISOString().slice(0, 10) },
      { header: 'Employee number', value: (row) => row.employee.employeeNumber },
      {
        header: 'Employee',
        value: (row) => `${row.employee.firstName} ${row.employee.lastName}`,
      },
      { header: 'Department', value: (row) => row.employee.department ?? '' },
      { header: 'Status', value: (row) => row.status },
      {
        header: 'Start',
        value: (row) => row.checkIn?.toISOString().slice(11, 16) ?? '',
      },
      {
        header: 'Finish',
        value: (row) => row.checkOut?.toISOString().slice(11, 16) ?? '',
      },
      { header: 'Hours', value: (row) => toNumber(row.hoursWorked) },
      { header: 'Notes', value: (row) => row.notes ?? '' },
    ]);

    return csvResponse(csv, exportFilename('attendance'));
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return new Response('Forbidden', { status: 403 });
    }
    throw error;
  }
}
