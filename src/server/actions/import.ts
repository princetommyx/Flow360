'use server';

import { revalidatePath } from 'next/cache';

import { findDataset } from '@/lib/import/datasets';
import { importRequestSchema } from '@/lib/validations/import';
import type { PermissionKey } from '@/lib/permissions';
import { AuthorizationError, requirePermission } from '@/server/tenant';
import { logActivity } from '@/server/activity';
import {
  ImportError,
  MAX_FILE_BYTES,
  previewImport,
  runImport,
  type ImportOutcome,
  type ImportPreview,
} from '@/server/services/import';
import { actionError, actionOk, type ActionResult } from '@/server/actions/types';

/**
 * The two things the import screen asks for: show me what you would do, and
 * now do it.
 *
 * The file arrives twice, once for each, rather than being parked on a server
 * between them. It costs a second upload and saves having somewhere that holds
 * other people's customer lists while they make up their mind.
 */

/**
 * Importing into a module means creating in it, and overwriting means editing
 * in it. Nothing new is invented for the importer: somebody who cannot add a
 * customer by hand cannot add ten thousand from a file either.
 */
async function authorise(datasetKey: string, mode: string) {
  const dataset = findDataset(datasetKey);
  if (!dataset) throw new ImportError('That is not something we can import.');

  const needed: PermissionKey[] =
    mode === 'update'
      ? [`${dataset.module}.create`, `${dataset.module}.edit`]
      : [`${dataset.module}.create`];

  return { dataset, context: await requirePermission(needed) };
}

/** A zip file's first two bytes. Every .xlsx is a zip. */
const ZIP_MAGIC = 'PK';

async function readUpload(form: FormData): Promise<{ name: string; text: string }> {
  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) {
    throw new ImportError('Choose a CSV file to import.');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new ImportError(
      `That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. Split it into files of ${MAX_FILE_BYTES / 1024 / 1024} MB or less.`,
    );
  }

  const text = await file.text();

  // A spreadsheet saved as .xlsx is a zip, and reading one as text gives
  // mojibake rather than an error. Saying what it is beats "no column
  // headings on the first line".
  if (text.startsWith(ZIP_MAGIC) || /\.xlsx?$/i.test(file.name)) {
    throw new ImportError(
      'That looks like an Excel workbook. Open it and use File → Save as → CSV, then try again.',
    );
  }

  return { name: file.name || 'import.csv', text };
}

function requestFrom(form: FormData) {
  const raw = form.get('mapping');
  const parsed = importRequestSchema.safeParse({
    dataset: form.get('dataset'),
    mode: form.get('mode'),
    mapping: typeof raw === 'string' && raw !== '' ? JSON.parse(raw) : null,
  });

  if (!parsed.success) {
    throw new ImportError(parsed.error.issues[0]?.message ?? 'Check what you asked for.');
  }
  return parsed.data;
}

export async function previewImportAction(
  form: FormData,
): Promise<ActionResult<ImportPreview>> {
  try {
    const request = requestFrom(form);
    const { context } = await authorise(request.dataset, request.mode);
    const upload = await readUpload(form);

    const preview = await previewImport({
      organizationId: context.organization.id,
      dataset: request.dataset as ImportPreview['dataset'],
      text: upload.text,
      mapping: request.mapping ?? null,
      mode: request.mode,
    });

    return actionOk(preview);
  } catch (error) {
    return failure(error);
  }
}

export async function runImportAction(form: FormData): Promise<ActionResult<ImportOutcome>> {
  try {
    const request = requestFrom(form);
    if (!request.mapping) {
      return actionError('Check the column mapping before importing.');
    }

    const { dataset, context } = await authorise(request.dataset, request.mode);
    const upload = await readUpload(form);

    const outcome = await runImport({
      organizationId: context.organization.id,
      userId: context.user.id,
      dataset: dataset.key,
      fileName: upload.name,
      text: upload.text,
      mapping: request.mapping,
      mode: request.mode,
    });

    await logActivity({
      organizationId: context.organization.id,
      userId: context.user.id,
      action: 'create',
      entityType: 'import',
      entityId: outcome.runId,
      summary: `Imported ${dataset.label.toLowerCase()} from ${upload.name}: ${outcome.created} added, ${outcome.updated} updated, ${outcome.failed} refused`,
      metadata: {
        dataset: dataset.key,
        created: outcome.created,
        updated: outcome.updated,
        skipped: outcome.skipped,
        failed: outcome.failed,
      },
    });

    // The whole point is that the records now show up where they belong.
    revalidatePath('/settings/import');
    revalidatePath(DESTINATION[dataset.key]);
    revalidatePath('/dashboard');

    return actionOk(outcome);
  } catch (error) {
    return failure(error);
  }
}

/** Where each dataset lands, so the list behind it is refreshed too. */
const DESTINATION: Record<string, string> = {
  customers: '/customers',
  suppliers: '/suppliers',
  'product-categories': '/categories',
  products: '/products',
  invoices: '/invoices',
};

function failure(error: unknown): ActionResult<never> {
  if (error instanceof ImportError) return actionError(error.message);
  if (error instanceof AuthorizationError) return actionError(error.message);
  if (error instanceof SyntaxError) return actionError('That column mapping could not be read.');
  throw error;
}
