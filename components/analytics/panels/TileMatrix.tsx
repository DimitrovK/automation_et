'use client';

import type { ReactNode } from 'react';
import { CappedList } from '@/components/reports/primitives/CappedList';
import { difficultyTier as tier } from '@/lib/data-colours';
import { cn } from '@/lib/utils';

/**
 * A row-label column, four difficulty tiles, and a total.
 *
 * Extracted when the third caller appeared. Questions by category, footballers
 * by nation and footballers by team are the same table asking the same question
 * of three different rows — "is this one thin at the top end" — and a
 * comparison ACROSS a row is what a matrix is for. Three copies would have
 * drifted the way the difficulty colours already did once.
 *
 * The caller owns the card, the copy and the controls; this owns the grid.
 */
export type TileRow = {
  key: string;
  name: string;
  total: number;
  /** Counts positionally matching `order`. */
  by_difficulty: number[];
  /** An extra figure after the total — growth, say. */
  extra?: number | null;
};

export function TileMatrix({ rows, order, rowHeading, total, shown, onExpand, expanded, emptyLabel, extraHeading, extraLabel, rankedBy, onRankBy }: {
  rows: TileRow[];
  order: string[];
  /**
   * What the row labels ARE — "Category", "Nation", "Team". A generic "Name"
   *  makes the reader work out what they are looking at.
   */
  rowHeading: string;
  total: number;
  shown: number;
  onExpand?: () => void;
  expanded?: boolean;
  emptyLabel: string;
  /** Column heading for `extra`. Omit and the column is not rendered. */
  extraHeading?: string;
  /** How to read one `extra` value, for assistive tech. */
  extraLabel?: (row: TileRow) => string;
  /**
   * The tier the rows are sorted by, when they are.
   *
   * Marked ON the column, not only in the copy above the table: pressing a
   * difficulty re-ordered the rows and left nothing in the grid to say which
   * column had caused it, so the new order looked arbitrary.
   */
  rankedBy?: string | null;
  /**
   * Rank by a tier from the header itself. The chips above the table already do
   * this, but a column header is where a reader reaches for a sort — leaving it
   * inert teaches them the table cannot be sorted.
   *
   * Called with null when the active column is clicked again, matching the chips.
   */
  onRankBy?: (difficulty: string | null) => void;
}): ReactNode {
  return (
    <CappedList
      total={total}
      shown={shown}
      onExpand={onExpand}
      expanded={expanded}
      emptyLabel={emptyLabel}
    >
      {/* Its own scroller: the matrix is wider than a phone and the page body
          must never scroll sideways. */}
      <div className="-mx-2 overflow-x-auto px-2">
        <table className="w-full min-w-[42rem] table-fixed border-separate border-spacing-x-1 border-spacing-y-1.5 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-52 bg-card py-1 pr-3 text-left text-xs font-medium text-muted-foreground">
                {rowHeading}
              </th>
              {order.map((difficulty) => {
                const ranked = rankedBy === difficulty;
                return (
                  <th key={difficulty} className="pb-1.5 text-center" aria-sort={ranked ? 'descending' : undefined}>
                    {/* A button when the caller can sort, a span when it cannot
                        — an inert control that looks clickable is worse than a
                        plain label. */}
                    {onRankBy
                      ? (
                          <button
                            type="button"
                            onClick={() => onRankBy(ranked ? null : difficulty)}
                            aria-pressed={ranked}
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-semibold transition-colors',
                              tier(difficulty).head,
                              ranked ? 'bg-primary/10 ring-1 ring-inset ring-primary/40' : 'hover:bg-muted',
                            )}
                          >
                            <span aria-hidden className={cn('size-1.5 rounded-full', tier(difficulty).dot)} />
                            {tier(difficulty).label}
                            {ranked && <span aria-hidden className="text-primary">↓</span>}
                            <span className="sr-only">
                              {ranked ? '(sorted by this column — press to clear)' : '(press to sort by this column)'}
                            </span>
                          </button>
                        )
                      : (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-semibold',
                              tier(difficulty).head,
                              ranked && 'bg-primary/10 ring-1 ring-inset ring-primary/40',
                            )}
                          >
                            {/* The dot stays saturated even though the tiles are
                                muted: a 6px dot needs far more saturation than a
                                56px tile to register at all. */}
                            <span aria-hidden className={cn('size-1.5 rounded-full', tier(difficulty).dot)} />
                            {tier(difficulty).label}
                            {ranked && <span aria-hidden className="text-primary">↓</span>}
                            {ranked && <span className="sr-only">(sorted by this column)</span>}
                          </span>
                        )}
                  </th>
                );
              })}
              <th className="pb-1.5 pl-2 text-center text-xs font-medium text-muted-foreground">Total</th>
              {extraHeading && (
                <th className="pb-1.5 pl-2 text-center text-xs font-medium text-muted-foreground">{extraHeading}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map(row => (
              <tr key={row.key} className="group">
                <th
                  scope="row"
                  className="sticky left-0 z-10 max-w-52 truncate bg-card py-1 pr-3 text-left font-medium text-foreground transition-colors group-hover:bg-muted/40"
                  title={row.name}
                >
                  {row.name}
                </th>
                {row.by_difficulty.map((count, index) => (
                  <Tile
                    key={order[index]}
                    difficulty={order[index]}
                    count={count}
                    index={index}
                    ranked={rankedBy === order[index]}
                  />
                ))}
                <td className="p-0 pl-2">
                  {/* Same height and shape as a tile so the row reads as one
                      set, and centred with them. */}
                  <span className="flex h-14 items-center justify-center rounded-lg bg-muted/70 text-sm font-bold tabular-nums text-foreground ring-1 ring-inset ring-border">
                    {row.total.toLocaleString()}
                  </span>
                </td>
                {extraHeading && (
                  <td className="p-0 pl-2">
                    <span
                      className={cn(
                        'flex h-14 items-center justify-center rounded-lg text-sm font-semibold tabular-nums ring-1 ring-inset',
                        row.extra
                          ? 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/30 dark:text-emerald-400'
                          : 'text-muted-foreground/40 ring-border',
                      )}
                      aria-label={extraLabel?.(row)}
                    >
                      {/* Nothing added is a dash, not a zero: a column of zeros
                          reads as a broken feed rather than a quiet week. */}
                      {row.extra ? `+${row.extra.toLocaleString()}` : '—'}
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CappedList>
  );
}

function Tile({ difficulty, count, index, ranked }: {
  difficulty: string;
  count: number;
  index: number;
  ranked?: boolean;
}) {
  const style = tier(difficulty);

  // A dash, not a zero. An empty tier is the thing you are looking for, and the
  // gaps are the reason to read this table — so it keeps the tile's shape while
  // clearly holding nothing.
  if (count === 0) {
    return (
      <td className="p-0">
        <span
          data-difficulty={difficulty}
          data-empty="true"
          className={cn(
            'flex h-14 items-center justify-center rounded-lg border border-dashed border-border/70 text-sm text-muted-foreground/40',
            ranked && 'ring-2 ring-inset ring-primary/40',
          )}
        >
          —
        </span>
      </td>
    );
  }

  return (
    <td className="p-0">
      <span
        data-difficulty={difficulty}
        className={cn(
          // No gradient and no shadow: both were reading as metal. A flat tile
          // is a coloured surface, not a polished one.
          'flex h-14 items-center justify-center rounded-lg text-sm font-bold tabular-nums',
          // Hover lifts the colour as well as the size. Scale alone reads as a
          // rendering quirk; a brightness change reads as a response.
          'animate-data-rise transition-all duration-150 hover:scale-[1.03] hover:brightness-125',
          // Alternating direction: slate-to-hue, then hue-to-slate. Two
          // neighbours meet light against dark instead of repeating, so the
          // seam is legible without a border between them.
          index % 2 === 0 ? style.chip : style.chipAlt,
          // AFTER the chip, deliberately. `cn` merges conflicting `ring-*`
          // utilities and keeps the LAST one, so a ranked ring declared before
          // the chip is silently removed by the chip's own `ring-white/10` —
          // the marker renders nothing and no type or lint check notices.
          ranked && 'ring-2 ring-inset ring-primary/40',
        )}
        style={{ animationDelay: `${Math.min(index, 5) * 45}ms` }}
      >
        {count.toLocaleString()}
      </span>
    </td>
  );
}
