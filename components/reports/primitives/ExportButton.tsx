'use client';

import type { CsvColumn } from '@/lib/report-csv';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { csvFilename, downloadCsv, toCsv } from '@/lib/report-csv';

/** Downloads exactly the rows currently rendered, with the filters in the filename. */
export function ExportButton<T>({ rows, columns, view, filters, label = 'Export CSV' }: {
  rows: T[];
  columns: CsvColumn<T>[];
  view: string;
  filters: Record<string, string | number | boolean | null | undefined>;
  label?: string;
}) {
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={rows.length === 0}
      title={rows.length === 0 ? 'Nothing to export' : `Export ${rows.length} rows`}
      onClick={() => downloadCsv(csvFilename(view, filters), toCsv(rows, columns))}
    >
      <Download className="mr-1 size-3.5" />
      {label}
      {rows.length > 0 && <span className="ml-1 opacity-70">{`(${rows.length})`}</span>}
    </Button>
  );
}
