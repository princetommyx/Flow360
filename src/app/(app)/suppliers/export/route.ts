import { csvResponse, exportFilename, toCsv } from '@/lib/csv';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { listSuppliersForExport } from '@/server/services/suppliers';

export async function GET(request: Request) {
  try {
    const context = await requirePermission('suppliers.export');

    const url = new URL(request.url);
    const params: SearchParams = Object.fromEntries(url.searchParams.entries());
    const query = parseListQuery(params, { sort: 'createdAt', dir: 'desc' });

    const suppliers = await listSuppliersForExport(context.organization.id, query);

    const csv = toCsv(suppliers, [
      { header: 'Company', value: (row) => row.companyName },
      { header: 'Contact', value: (row) => row.name },
      { header: 'Email', value: (row) => row.email },
      { header: 'Phone', value: (row) => row.phone },
      { header: 'City', value: (row) => row.city },
      { header: 'Country', value: (row) => row.country },
      { header: 'Payment terms (days)', value: (row) => row.paymentTermDays },
      { header: 'Tax ID', value: (row) => row.taxId },
      { header: 'Status', value: (row) => row.status },
    ]);

    return csvResponse(csv, exportFilename('suppliers'));
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return new Response('Forbidden', { status: 403 });
    }
    throw error;
  }
}
