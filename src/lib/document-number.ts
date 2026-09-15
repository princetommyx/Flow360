/**
 * How a document number is spelled.
 *
 * Pure, and shared: the allocator in `server/numbering.ts` builds real numbers
 * with it and the settings page previews with it, so the example a reader is
 * shown before saving is the same string they will get afterwards.
 */
export function formatDocumentNumber(input: {
  prefix: string;
  year: number;
  serial: number;
  padding: number;
  includeYear: boolean;
}): string {
  const serial = String(input.serial).padStart(input.padding, '0');
  return input.includeYear
    ? `${input.prefix}-${input.year}-${serial}`
    : `${input.prefix}-${serial}`;
}
