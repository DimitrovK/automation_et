'use client';

import { X } from 'lucide-react';

/**
 * What the page is currently narrowed to, as removable chips.
 *
 * The pickers themselves (range control, mode table) show state where they
 * live, which is scattered down the page — this row says it in one place,
 * right under the filter bar, and every chip clears with one click. No
 * chips render when nothing is narrowed, so the default view carries no
 * furniture.
 */

export type FilterChip = {
  key: string;
  /** "Mode", "Range" — what kind of narrowing this is. */
  kind: string;
  label: string;
  onClear: () => void;
};

export function ActiveFilterChips({ chips }: { chips: FilterChip[] }) {
  if (chips.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Narrowed to</span>
      {chips.map(chip => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 py-1 pr-1.5 pl-3 text-xs font-medium text-foreground"
        >
          <span className="text-muted-foreground">{chip.kind}</span>
          {chip.label}
          <button
            type="button"
            aria-label={`Clear ${chip.kind.toLowerCase()} filter`}
            onClick={chip.onClear}
            className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-primary/20 hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
    </div>
  );
}
