import { csvResponse, exportFilename, toCsv } from '@/lib/csv';
import { findDataset } from '@/lib/import/datasets';
import { AuthorizationError, requirePermission, requireTenant } from '@/server/tenant';
import { getImportRun } from '@/server/services/import';

type StoredIssue = { row: number; message: string };
type StoredIssues = { errors?: StoredIssue[]; warnings?: StoredIssue[] };

/**
 * The rows an import would not take, as a file.
 *
 * Twenty-five of them are on screen; a bad export can produce hundreds, and
 * nobody fixes hundreds of rows by scrolling a web page. This is the list they
 * open next to their own spreadsheet, which is why the row number is the first
 * column and it counts the way a spreadsheet counts.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await requireTenant();
    const { id } = await params;

    const run = await getImportRun(context.organization.id, id);
    if (!run) return new Response('Not found', { status: 404 });

    // Whoever could have run this import may read what it would not take.
    const dataset = findDataset(run.dataset);
    if (!dataset) return new Response('Not found', { status: 404 });
    await requirePermission(`${dataset.module}.create`);

    const stored = (run.errors ?? {}) as StoredIssues;
    const rows = [
      ...(stored.errors ?? []).map((issue) => ({ ...issue, kind: 'Not imported' })),
      ...(stored.warnings ?? []).map((issue) => ({ ...issue, kind: 'Imported with a note' })),
    ].sort((a, b) => a.row - b.row);

    const csv = toCsv(rows, [
      { header: 'Row in your file', value: (row) => row.row },
      { header: 'What happened', value: (row) => row.kind },
      { header: 'Why', value: (row) => row.message },
    ]);

    return csvResponse(csv, exportFilename(`import-${run.dataset}-issues`));
  } catch (error) {
    if (error instanceof AuthorizationError) return new Response('Forbidden', { status: 403 });
    throw error;
  }
}
