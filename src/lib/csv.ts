/** RFC 4180 CSV serialisation for the export buttons on list pages. */

export type CsvColumn<T> = {
  header: string;
  value: (row: T) => string | number | null | undefined;
};

function escapeCell(input: string | number | null | undefined): string {
  if (input === null || input === undefined) return '';
  const value = String(input);
  // A leading =, +, - or @ is interpreted as a formula by spreadsheet apps.
  const guarded = /^[=+\-@]/.test(value) ? `'${value}` : value;
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
