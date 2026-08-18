'use client';

import { DataPagination } from '@/components/ui/data-pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RANKED_PAGE_SIZES, sortState } from '@/hooks/use-ranked-table';
import { cn } from '@/lib/utils';

/** A column heading you can press, marked when it is the one in force. */
export function SortableHeader({ label, column, ordering, onSort, className }: {
  label: string;
  column: string;
  ordering: string;
  onSort: (column: string) => void;
  className?: string;
}) {
  const state = sortState(ordering, column);
  const arrow = state === 'ascending' ? '↑' : '↓';

  return (
    <th scope="col" aria-sort={state} className={cn('px-2 pb-2 text-xs font-medium', className)}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors',
          state
            ? 'bg-primary/10 text-foreground ring-1 ring-inset ring-primary/40'
            : 'text-muted-foreground hover:bg-muted',
        )}
      >
        {label}
        {state && <span aria-hidden className="text-primary">{arrow}</span>}
        <span className="sr-only">
          {state ? '(sorted by this column — press to change)' : '(press to sort by this column)'}
        </span>
      </button>
    </th>
  );
}

/**
 * Row count on the left, paginator on the right.
 *
 * The page size comes from the server's echo rather than local state, so the
 * dropdown shows what was actually served — including when the endpoint clamps
 * a value it will not honour.
 */
export function TableControls({ page, pages, total, pageSize, shown, onPageChange, onPageSizeChange, busy }: {
  page: number;
  pages: number;
  total: number;
  pageSize: number;
  shown: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  busy?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Rows</span>
        <Select
          value={String(pageSize)}
          onValueChange={value => onPageSizeChange(Number(value))}
          disabled={busy}
        >
          <SelectTrigger aria-label="Rows per page" className="h-8 w-[4.5rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RANKED_PAGE_SIZES.map(size => (
              <SelectItem key={size} value={String(size)}>{size}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataPagination
        currentPage={page}
        totalPages={pages}
        totalCount={total}
        visibleCount={shown}
        onPageChange={onPageChange}
        disabled={busy}
      />
    </div>
  );
}
