import { csvResponse, exportFilename, toCsv } from '@/lib/csv';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { listPayrollForExport } from '@/server/services/payroll';
import { toNumber } from '@/lib/money';

export async function GET(request: Request) {
  try {
    const context = await requirePermission('payroll.export');

    const url = new URL(request.url);
    const params: SearchParams = Object.fromEntries(url.searchParams.entries());
    const query = parseListQuery(params, { sort: 'periodStart', dir: 'desc' });

    const payrolls = await listPayrollForExport(context.organization.id, query);

    const csv = toCsv(payrolls, [
      { header: 'Payslip', value: (row) => row.number },
      { header: 'Employee number', value: (row) => row.employee.employeeNumber },
      {
        header: 'Employee',
        value: (row) => `${row.employee.firstName} ${row.employee.lastName}`,
      },
      { header: 'Department', value: (row) => row.employee.department ?? '' },
      { header: 'From', value: (row) => row.periodStart.toISOString().slice(0, 10) },
      { header: 'To', value: (row) => row.periodEnd.toISOString().slice(0, 10) },
      { header: 'Base pay', value: (row) => toNumber(row.baseSalary) },
      { header: 'Allowances', value: (row) => toNumber(row.allowances) },
      { header: 'Overtime', value: (row) => toNumber(row.overtime) },
      { header: 'Bonus', value: (row) => toNumber(row.bonus) },
      { header: 'Tax', value: (row) => toNumber(row.taxDeduction) },
      { header: 'Other deductions', value: (row) => toNumber(row.otherDeduction) },
      { header: 'Take-home', value: (row) => toNumber(row.netSalary) },
      { header: 'Status', value: (row) => row.status },
      { header: 'Paid', value: (row) => row.paidAt?.toISOString().slice(0, 10) ?? '' },
      { header: 'Currency', value: (row) => row.currency },
    ]);

    return csvResponse(csv, exportFilename('payroll'));
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return new Response('Forbidden', { status: 403 });
    }
    throw error;
  }
}
