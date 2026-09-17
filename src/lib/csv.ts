/** RFC 4180 CSV serialisation for the export buttons on list pages. */

export type CsvColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

function escapeCell(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  const value = String(input);

  // A leading =, +, - or @ is read as a formula by spreadsheet apps, so text
  // starting that way is quoted out. A real number is exempt: guarding it
  // would turn every negative in a financial export into text, and a column
  // of text will not total.
  const guarded =
    typeof input !== 'number' && /^[=+\-@]/.test(value) ? `'${value}` : value;

  return /[",\n\r]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

export function toCsv<T>(rows: T[], columns: Array<CsvColumn<T>>): string {
  const header = columns.map((column) => escapeCell(column.header)).join(',');
  const body = rows.map((row) =>
    columns.map((column) => escapeCell(column.value(row))).join(','),
  );
  // The BOM makes Excel read UTF-8 correctly.
  return `﻿${[header, ...body].join('\r\n')}\r\n`;
}

export function csvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename.replace(/"/g, '')}"`,
      'Cache-Control': 'no-store',
    },
  });
}

export function exportFilename(prefix: string, extension = 'csv') {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.${extension}`;
}

/* ── Reading ──────────────────────────────────────────────────────────────── */

export type ParsedCsv = {
  headers: string[];
  /** One entry per data row, already padded to `headers.length`. */
  rows: string[][];
};

/**
 * RFC 4180 reader, written out rather than pulled in.
 *
 * A regular expression cannot do this: a quoted field may contain commas,
 * newlines and doubled quotes, so the only correct way through is character by
 * character with a flag for whether we are inside quotes. It is fifty lines and
 * it is the difference between importing an address with a comma in it and
 * silently shredding somebody's customer list.
 *
 * Tolerances, all of which real exports need: a UTF-8 BOM (Excel writes one, so
 * does our own exporter), CRLF or LF or CR line endings, a trailing newline,
 * and short rows — a row with fewer cells than the header is padded rather than
 * rejected, because spreadsheet software drops trailing empty cells.
 */
export function parseCsv(input: string, delimiter = ','): ParsedCsv {
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;

  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  let started = false;

  const endField = () => {
    row.push(field);
    field = '';
    started = false;
  };
  const endRow = () => {
    endField();
    // A line that is entirely empty is a blank line, not a row of one empty
    // cell. Exports end with one and it must not become a failing record.
    if (row.length > 1 || row[0] !== '') rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"' && !started) {
      quoted = true;
      started = true;
      continue;
    }

    if (char === delimiter) {
      endField();
      continue;
    }

    if (char === '\r') {
      // Swallow the \n of a \r\n pair; a lone \r is an old Mac line ending.
      if (text[i + 1] === '\n') i += 1;
      endRow();
      continue;
    }

    if (char === '\n') {
      endRow();
      continue;
    }

    field += char;
    started = true;
  }

  // Whatever is still in hand when the text runs out is the last row, unless
  // the file ended on a line break and there is nothing left to flush.
  if (field !== '' || row.length > 0) endRow();

  const headers = (rows.shift() ?? []).map((header) => header.trim());
  const width = headers.length;

  return {
    headers,
    rows: rows.map((cells) =>
      cells.length === width
        ? cells
        : Array.from({ length: width }, (_, index) => cells[index] ?? ''),
    ),
  };
}

/**
 * Which delimiter a file actually uses.
 *
 * Exports from a machine set to a comma-decimal locale are semicolon
 * separated, and a file like that read as CSV parses as one enormous column.
 * The winner is whichever character appears most often in the header line,
 * which is the one line guaranteed to be free of decimal points and prose.
 */
export function detectDelimiter(input: string): string {
  const firstLine = (input.charCodeAt(0) === 0xfeff ? input.slice(1) : input)
    .split(/\r?\n/, 1)[0] ?? '';

  const candidates = [',', ';', '\t', '|'];
  let best = ',';
  let bestCount = 0;

  for (const candidate of candidates) {
    const count = firstLine.split(candidate).length - 1;
    if (count > bestCount) {
      best = candidate;
      bestCount = count;
    }
  }

  return best;
}
