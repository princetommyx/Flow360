import { z } from 'zod';

import { IMPORT_DATASETS } from '@/lib/import/datasets';

const DATASET_KEYS = IMPORT_DATASETS.map((dataset) => dataset.key) as [string, ...string[]];

/**
 * What the importer is asked to do, as it arrives from the browser.
 *
 * The mapping is the interesting one: it is a record of field name to column
 * index, and it comes from a form the person has been editing, so every index
 * is checked to be a whole number within the file rather than trusted as one.
 */
export const importMappingSchema = z.record(
  z.string().min(1).max(60),
  z.number().int().min(0).max(999).nullable(),
);

export const importRequestSchema = z.object({
  dataset: z.enum(DATASET_KEYS, { message: 'Choose what you are importing' }),
  mode: z.enum(['create', 'update'], { message: 'Choose how existing records are treated' }),
  mapping: importMappingSchema.nullable().optional(),
});

export type ImportRequestInput = z.infer<typeof importRequestSchema>;
