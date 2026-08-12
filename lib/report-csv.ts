/**
 * CSV export for the reporting tables.
 *
 * Exports what is on screen — the same rows, filters and range the user is
 * looking at — rather than re-querying. A file that quietly contains something
 * different from the view it came from is worse than no export.
 */

export type CsvColumn<T> = {
  header: string;
  /** Return a primitive; objects are stringified by the caller's choice, not ours. */
  value: (row: T) => string | number | boolean | null | undefined;
};

/**
 * Escape one cell.
 *
 * A leading =, +, - or @ is prefixed with an apostrophe: spreadsheets treat those
 * as formulas, so a username like `=cmd()` would execute on open. Usernames reach
 * these exports, so this is a real path, not a theoretical one.
 */
function escapeCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  let text = String(value);
  if (/^[=+\-@]/.test(text)) {
    text = `'${text}`;
  }
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map(column => escapeCell(column.header)).join(',');
  const body = rows.map(row => columns.map(column => escapeCell(column.value(row))).join(','));
  return [header, ...body].join('\n');
}

/** Filename carrying the filters, so a folder of exports stays interpretable. */
export function csvFilename(view: string, parts: Record<string, string | number | boolean | null | undefined>): string {
  const suffix = Object.entries(parts)
    .filter(([, value]) => value !== null && value !== undefined && value !== '' && value !== false)
    .map(([key, value]) => (value === true ? key : `${key}-${value}`))
    .join('_');
  return `extratime-${view}${suffix ? `_${suffix}` : ''}.csv`;
}

export function downloadCsv(filename: string, csv: string): void {
  // A UTF-8 BOM so Excel reads the file correctly — without it, accented usernames arrive
  // mangled, which is exactly the sort of thing nobody reports and everybody
  // works around.
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
