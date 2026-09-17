import { csvResponse, toCsv } from '@/lib/csv';
import { findDataset } from '@/lib/import/datasets';
import { AuthorizationError, requirePermission } from '@/server/tenant';

/**
 * A blank file with our own headings on it.
 *
 * For anyone not coming from ERPNext, or coming from a spreadsheet they keep by
 * hand. The headings are the field labels, which the importer matches exactly,
 * so a file built on this maps itself with nothing left to correct.
 *
 * Headings and nothing else. A template with a worked example row in it is a
 * template somebody eventually imports without deleting the example, and then
 * has a customer called Ama Boateng they cannot account for. The worked example
 * is in the guide, where it cannot be loaded by accident.
 */
export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get('dataset') ?? '';
  const dataset = findDataset(key);
  if (!dataset) return new Response('Unknown dataset', { status: 404 });

  try {
    await requirePermission(`${dataset.module}.create`);
  } catch (error) {
    if (error instanceof AuthorizationError) return new Response('Forbidden', { status: 403 });
    throw error;
  }

  const csv = toCsv<never>(
    [],
    dataset.fields.map((field) => ({ header: field.label, value: () => '' })),
  );

  return csvResponse(csv, `adwuma360-${dataset.key}-template.csv`);
}
