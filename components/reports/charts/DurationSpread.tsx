'use client';

import type { DurationRow } from '@/types/reports';
import { formatDuration } from '@/lib/format-duration';

/**
 * The shape of a game's session lengths, in one row.
 *
 * A median is one number and says nothing about spread. Scout's median session
 * is 6.8 minutes and its p90 is 10.8 days; Team Ties sits between 3.3 and 7.3
 * minutes at the quartiles. Both reported "a few minutes", and only one of them
 * is a few-minute game.
 *
 * The bar is the interquartile range — where the middle half of sessions live —
 * with the median marked inside it. Not a box plot: whiskers and outlier dots
 * need a legend to read, and this has to work as a table cell, at a glance,
 * beside ten other games.
 */
export function DurationSpread({ row }: { row: DurationRow }) {
  const { p25_seconds: p25, p75_seconds: p75, median_seconds: median, p90_seconds: p90 } = row;

  if (p25 === null || p25 === undefined || p75 === null || p75 === undefined || median === null) {
    return <span className="text-xs text-muted-foreground/70">—</span>;
  }

  // Scaled against p90 rather than the longest session: one abandoned session
  // left open for a week would squash every game's bar to a sliver, and the
  // shape is the point of the control.
  const scale = Math.max(p90 ?? p75, p75, 1);
  const pct = (value: number) => Math.min(100, Math.max(0, (value / scale) * 100));
  const left = pct(p25);
  const width = Math.max(1.5, pct(p75) - left);

  return (
    <span
      className="flex items-center gap-2"
      title={`25% of sessions under ${formatDuration(p25)} · half under ${formatDuration(median)} · 75% under ${formatDuration(p75)} · 90% under ${formatDuration(p90 ?? null)}`}
    >
      <span className="relative h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-muted">
        <span
          className="absolute inset-y-0 rounded-full bg-muted-foreground/40"
          style={{ left: `${left}%`, width: `${width}%` }}
        />
        {/* The median inside the range, because "the middle half runs 3–7
            minutes" and "the middle is at 4" are different facts and a reader
            needs both to judge whether the median represents anything. */}
        <span
          className="absolute inset-y-0 w-0.5 bg-foreground"
          style={{ left: `${Math.min(99, pct(median))}%` }}
        />
      </span>
      <span className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
        {formatDuration(p25)}
        –
        {formatDuration(p75)}
      </span>
    </span>
  );
}
