import {
  normaliseHeader,
  type ImportDataset,
  type ImportField,
} from '@/lib/import/datasets';

/**
 * Turning somebody else's spreadsheet into our fields.
 *
 * Two jobs: guess which of their columns is which of ours, and read a cell of
 * text into the type the field wants. Both are pure, both are exercised by the
 * preview before a single row is written, and every guess is shown to the
 * person and can be overruled.
 */

/** Field key → index into the header row, or null for "not mapped". */
export type ColumnMap = Record<string, number | null>;

/**
 * Matches each field to a column, first by the field's own key and label, then
 * by its aliases.
 *
 * A column is claimed once. Fields are considered in the order the dataset
 * lists them, which is why `name` sits above `externalId` in every dataset: a
 * file with a bare `name` column means the thing's name far more often than it
 * means its ERPNext docname, and whichever field asks first gets it.
 */
export function autoMap(headers: string[], dataset: ImportDataset): ColumnMap {
  const normalised = headers.map(normaliseHeader);
  const taken = new Set<number>();
  const map: ColumnMap = {};

  const claim = (field: ImportField, names: string[]): boolean => {
    for (const name of names) {
      const index = normalised.indexOf(name);
      if (index !== -1 && !taken.has(index)) {
        taken.add(index);
        map[field.key] = index;
        return true;
      }
    }
    return false;
  };

  // Two passes. The first takes only exact matches on the field's own name, so
  // a file written from our template maps perfectly whatever aliases might also
  // have fitted; the second falls back to what other systems call it.
  for (const field of dataset.fields) {
    map[field.key] = null;
  }
  for (const field of dataset.fields) {
    claim(field, [normaliseHeader(field.key), normaliseHeader(field.label)]);
  }
  for (const field of dataset.fields) {
    if (map[field.key] === null) claim(field, field.aliases);
  }

  return map;
}

/** Columns of theirs that nothing is reading, for the preview to mention. */
export function unmappedColumns(headers: string[], map: ColumnMap): string[] {
  const used = new Set(Object.values(map).filter((i): i is number => i !== null));
  return headers.filter((header, index) => !used.has(index) && header.trim() !== '');
}

/* ── Reading a cell ───────────────────────────────────────────────────────── */

export type Coerced =
  | { ok: true; value: string | number | boolean | string[] | Date | null }
  | { ok: false; error: string };

/**
 * A number as typed by a human or written by a spreadsheet.
 *
 * Handles currency symbols, spaces, thousands separators and both decimal
 * conventions. Where a cell holds both a dot and a comma the last of the two is
 * the decimal point, which is true of `1,234.56` and of `1.234,56` alike.
 * Accountancy's parenthesised negative — `(1,200.00)` — is read as one.
 */
export function parseNumber(raw: string): number | null {
  let text = raw.trim();
  if (text === '') return null;

  let sign = 1;
  if (/^\(.*\)$/.test(text)) {
    sign = -1;
    text = text.slice(1, -1);
  }

  // Everything that is not a digit, a separator or a leading minus.
  text = text.replace(/[^0-9.,\-]/g, '').trim();
  if (text === '' || text === '-') return null;

  const lastDot = text.lastIndexOf('.');
  const lastComma = text.lastIndexOf(',');

  if (lastDot !== -1 && lastComma !== -1) {
    const decimal = lastDot > lastComma ? '.' : ',';
    const thousands = decimal === '.' ? ',' : '.';
    text = text.split(thousands).join('').replace(decimal, '.');
  } else if (lastComma !== -1) {
    // A lone comma is a decimal point when it is followed by one or two digits
    // and appears once; otherwise it is separating thousands.
    const parts = text.split(',');
    text =
      parts.length === 2 && parts[1].length > 0 && parts[1].length <= 2
        ? `${parts[0]}.${parts[1]}`
        : parts.join('');
  } else if (lastDot !== -1) {
    const parts = text.split('.');
    // `1.234.567` is thousands-separated; `1.23` is not.
    text = parts.length > 2 ? parts.join('') : text;
  }

  const value = Number(text);
  return Number.isFinite(value) ? sign * value : null;
}

const TRUE_WORDS = new Set(['1', 'true', 'yes', 'y', 't', 'on', 'checked']);
const FALSE_WORDS = new Set(['0', 'false', 'no', 'n', 'f', 'off', '']);

/**
 * A date as exported by something else.
 *
 * ISO first, because that is what ERPNext writes and it cannot be misread.
 * After that the separated forms are day-first, which is what Ghana, the UK and
 * most of ERPNext's own locale settings use — unless the numbers settle it,
 * which they do whenever one of the two exceeds twelve. A file whose dates are
 * month-first and all on or before the twelfth is the one case this cannot
 * detect, so the preview shows every date it has read before anything is
 * written.
 */
export function parseDate(raw: string): Date | null {
  const text = raw.trim();
  if (text === '') return null;

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ].*)?$/.exec(text);
  if (iso) return utc(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const parts = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})$/.exec(text);
  if (parts) {
    const first = Number(parts[1]);
    const second = Number(parts[2]);
    let year = Number(parts[3]);
    if (year < 100) year += year < 70 ? 2000 : 1900;

    const dayFirst = second <= 12;
    const day = dayFirst ? first : second;
    const month = dayFirst ? second : first;
    return utc(year, month, day);
  }

  // `15 Jan 2026`, `Jan 15, 2026` and friends. Date.parse is inconsistent about
  // much else, so it is the last resort rather than the first.
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function utc(year: number, month: number, day: number): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  // Rejects the 31st of February rather than rolling it into March.
  return date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? date : null;
}

export function coerce(raw: string, field: ImportField): Coerced {
  const text = raw.trim();

  if (text === '') {
    if (field.type === 'enum' && field.fallback) {
      return { ok: true, value: field.fallback };
    }
    return { ok: true, value: null };
  }

  switch (field.type) {
    case 'text':
      return { ok: true, value: text };

    case 'list':
      return {
        ok: true,
        value: text
          .split(/[,;]/)
          .map((part) => part.trim())
          .filter(Boolean)
          .slice(0, 12),
      };

    case 'number':
    case 'integer': {
      const value = parseNumber(text);
      if (value === null) {
        return { ok: false, error: `“${truncate(text)}” is not a number` };
      }
      return { ok: true, value: field.type === 'integer' ? Math.round(value) : value };
    }

    case 'boolean': {
      const word = text.toLowerCase();
      if (TRUE_WORDS.has(word)) return { ok: true, value: true };
      if (FALSE_WORDS.has(word)) return { ok: true, value: false };
      return { ok: false, error: `“${truncate(text)}” is not a yes or a no` };
    }

    case 'date': {
      const value = parseDate(text);
      if (value === null) {
        return { ok: false, error: `“${truncate(text)}” is not a date we can read` };
      }
      return { ok: true, value };
    }

    case 'enum': {
      const word = normaliseHeader(text);
      const mapped = field.values?.[word];
      if (mapped) return { ok: true, value: mapped };
      if (field.fallback) return { ok: true, value: field.fallback };
      return { ok: false, error: `“${truncate(text)}” is not one we recognise` };
    }

    default:
      return { ok: true, value: text };
  }
}

function truncate(text: string, max = 30): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/* ── Reading a file into records ──────────────────────────────────────────── */

export type RowIssue = { row: number; field?: string; message: string };

export type ReadRecord = {
  /** 1-based row number in their file, counting the header as row 1. */
  row: number;
  values: Record<string, unknown>;
  /** One entry per line, for a dataset that has them. */
  lines: Array<Record<string, unknown>>;
};

export type ReadResult = {
  records: ReadRecord[];
  issues: RowIssue[];
};

/**
 * Reads every row through the confirmed mapping.
 *
 * For a dataset with `groupBy`, a row whose grouping cell is empty belongs to
 * the document above it: that is how ERPNext writes a document with several
 * lines, and reading it any other way turns a three-line invoice into three
 * invoices, two of them nameless.
 */
export function readRecords(
  rows: string[][],
  dataset: ImportDataset,
  map: ColumnMap,
): ReadResult {
  const records: ReadRecord[] = [];
  const issues: RowIssue[] = [];

  const documentFields = dataset.fields.filter((field) => !field.line);
  const lineFields = dataset.fields.filter((field) => field.line);

  const cell = (row: string[], key: string): string => {
    const index = map[key];
    return index === null || index === undefined ? '' : (row[index] ?? '');
  };

  const readInto = (
    row: string[],
    fields: ImportField[],
    rowNumber: number,
  ): Record<string, unknown> => {
    const values: Record<string, unknown> = {};
    for (const field of fields) {
      if (map[field.key] === null || map[field.key] === undefined) continue;
      const result = coerce(cell(row, field.key), field);
      if (result.ok) {
        values[field.key] = result.value;
      } else {
        issues.push({ row: rowNumber, field: field.key, message: `${field.label}: ${result.error}` });
      }
    }
    return values;
  };

  let current: ReadRecord | null = null;

  rows.forEach((row, index) => {
    // Their header is row 1, so the first row of data is row 2 — which is what
    // a spreadsheet shows in its own gutter, and where they will go to fix it.
    const rowNumber = index + 2;
    const blank = row.every((value) => value.trim() === '');
    if (blank) return;

    if (dataset.groupBy) {
      const key = cell(row, dataset.groupBy).trim();
      const continuation = key === '' && current !== null;

      if (!continuation) {
        current = { row: rowNumber, values: readInto(row, documentFields, rowNumber), lines: [] };
        records.push(current);
      }

      if (current) {
        const line = readInto(row, lineFields, rowNumber);
        // A document row with nothing in any line column is a document with no
        // line on that row, not an empty line.
        if (Object.values(line).some((value) => value !== null && value !== '')) {
          current.lines.push({ ...line, __row: rowNumber });
        }
      }
      return;
    }

    records.push({ row: rowNumber, values: readInto(row, documentFields, rowNumber), lines: [] });
  });

  return { records, issues };
}
