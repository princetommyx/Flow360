import { csvResponse, exportFilename, toCsv } from '@/lib/csv';
import { parseListQuery, type SearchParams } from '@/lib/query';
import { requirePermission, AuthorizationError } from '@/server/tenant';
import { listCustomersForExport } from '@/server/services/customers';
import { toNumber } from '@/lib/money';

export async function GET(request: Request) {
  try {
    const context = await requirePermission('customers.export');

    const url = new URL(request.url);
    const params: SearchParams = Object.fromEntries(url.searchParams.entries());
    const query = parseListQuery(params, { sort: 'createdAt', dir: 'desc' });

    const customers = await listCustomersForExport(context.organization.id, query);

    const csv = toCsv(customers, [
      { header: 'Name', value: (row) => row.name },
      { header: 'Company', value: (row) => row.companyName },
      { header: 'Email', value: (row) => row.email },
      { header: 'Phone', value: (row) => row.phone },
      { header: 'Tax ID', value: (row) => row.taxId },
      { header: 'Address', value: (row) => row.addressLine1 },
      { header: 'City', value: (row) => row.city },
      { header: 'State', value: (row) => row.state },
      { header: 'Postal code', value: (row) => row.postalCode },
      { header: 'Country', value: (row) => row.country },
      { header: 'Payment terms (days)', value: (row) => row.paymentTermDays },
      { header: 'Credit limit', value: (row) => toNumber(row.creditLimit) },
      { header: 'Status', value: (row) => row.status },
      { header: 'Tags', value: (row) => row.tags.join('; ') },
      { header: 'Created', value: (row) => row.createdAt.toISOString().slice(0, 10) },
    ]);

    return csvResponse(csv, exportFilename('customers'));
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return new Response('Forbidden', { status: 403 });
    }
    throw error;
  }
}
