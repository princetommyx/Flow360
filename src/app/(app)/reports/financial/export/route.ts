import { csvResponse, exportFilename, toCsv } from '@/lib/csv';
import { parsePreset, resolveDateRange } from '@/lib/date';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { getCashFlow, getCashPosition, getProfitAndLoss } from '@/server/services/reports';

type Unit = 'money' | 'count' | 'units' | 'percent' | 'date';

/**
 * One cell of the report, with what its number is measured in.
 *
 * A single `Currency` column stamped on every row reads as if a count of
 * invoices were an amount of money, which is exactly the kind of thing a
 * spreadsheet will happily total for you.
 */
type Row = { section: string; label: string; detail: string; value: number | string; unit: Unit };

export async function GET(request: Request) {
  try {
    const context = await requirePermission(['reports.view', 'reports.export']);
    const organizationId = context.organization.id;

    const url = new URL(request.url);
    const preset = parsePreset(url.searchParams.get('period'));
    const range = resolveDateRange(preset, {
      from: url.searchParams.get('from') ?? undefined,
      to: url.searchParams.get('to') ?? undefined,
    });

    const [pnl, cash, accounts] = await Promise.all([
      getProfitAndLoss(organizationId, range),
      getCashFlow(organizationId, range),
      getCashPosition(organizationId),
    ]);

    const rows: Row[] = [
      { section: 'Period', label: 'From', detail: '', value: range.from.toISOString().slice(0, 10), unit: 'date' },
      { section: 'Period', label: 'To', detail: '', value: range.to.toISOString().slice(0, 10), unit: 'date' },
      { section: 'Profit and loss', label: 'Revenue', detail: 'Invoices issued', value: pnl.revenue, unit: 'money' },
      { section: 'Profit and loss', label: 'Purchases', detail: 'Bills received', value: -pnl.purchases, unit: 'money' },
      { section: 'Profit and loss', label: 'Gross profit', detail: '', value: pnl.grossProfit, unit: 'money' },
      { section: 'Profit and loss', label: 'Gross margin', detail: '', value: pnl.grossMargin, unit: 'percent' },
      ...pnl.operatingExpenses.map((row): Row => ({
        section: 'Operating expenses',
        label: row.name,
        detail: `${row.count} recorded`,
        value: -row.total,
        unit: 'money',
      })),
      { section: 'Operating expenses', label: 'Payroll', detail: 'Payslips in period', value: -pnl.payroll, unit: 'money' },
      {
        section: 'Profit and loss',
        label: 'Total operating cost',
        detail: '',
        value: -(pnl.operatingTotal + pnl.payroll),
        unit: 'money',
      },
      { section: 'Profit and loss', label: 'Net profit', detail: '', value: pnl.netProfit, unit: 'money' },
      { section: 'Profit and loss', label: 'Net margin', detail: '', value: pnl.netMargin, unit: 'percent' },
      { section: 'Cash flow', label: 'Money in', detail: '', value: cash.inflow, unit: 'money' },
      { section: 'Cash flow', label: 'Money out', detail: '', value: -cash.outflow, unit: 'money' },
      { section: 'Cash flow', label: 'Net movement', detail: '', value: cash.net, unit: 'money' },
      ...accounts.map((account): Row => ({
        section: 'Account balance',
        label: account.name,
        detail: account.type,
        value: account.balance,
        unit: 'money',
      })),
    ];

    const csv = toCsv(rows, [
      { header: 'Section', value: (row) => row.section },
      { header: 'Name', value: (row) => row.label },
      { header: 'Detail', value: (row) => row.detail },
      { header: 'Value', value: (row) => row.value },
      {
        header: 'Unit',
        value: (row) =>
          row.unit === 'money'
            ? context.organization.currency
            : row.unit === 'percent'
              ? '%'
              : row.unit,
      },
    ]);

    return csvResponse(csv, exportFilename('profit-and-loss'));
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return new Response('Forbidden', { status: 403 });
    }
    throw error;
  }
}
