/**
 * Age bands of the unfinished pool, ready to read.
 *
 * The labels come from the boundaries the backend sent, never from a parallel
 * list here: a second copy drifts the first time a boundary moves, and the panel
 * would then be confidently mislabelled rather than obviously broken.
 *
 * Both bounds are used. `to_hours` alone reads as "under 24h" when the band
 * actually covers 1–24h — the youngest band is reported separately, so every
 * edge above it is a floor as well as a ceiling. Labelling from the ceiling
 * alone produces overlapping bands that each look correct on their own, which
 * is worse than an error because nothing signals it.
 */

import type { UnfinishedBucket } from '@/types/reports';

export type UnfinishedBand = {
  label: string;
  count: number;
  /** Share of this game's unfinished pool, rounded on its own. */
  pct: number;
};

/**
 * "2h", "3d", "1w" — the coarsest unit that still reads EXACTLY.
 *
 * Divisibility is the whole condition. Dividing by 24 whenever the count merely
 * reaches 24 turns a 25-hour boundary into "1.0416666666666667d" — the label
 * stops being a boundary and becomes a float. Today's boundaries (1, 24, 168)
 * all divide cleanly, so this was invisible; it would have surfaced the first
 * time one of them moved, in a band label nobody re-reads.
 */
function hoursToWords(hours: number): string {
  if (hours % 168 === 0) {
    return `${hours / 168}w`;
  }
  if (hours % 24 === 0) {
    return `${hours / 24}d`;
  }

  return `${hours}h`;
}

export function unfinishedBands(buckets: UnfinishedBucket[]): UnfinishedBand[] {
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  if (total === 0) {
    return [];
  }

  return buckets.map((bucket) => {
    const label = bucket.to_hours === null
      ? `over ${hoursToWords(bucket.from_hours)}`
      : bucket.from_hours === 0
        // The youngest band is the "probably still playing" one, so it is named
        // for what it means rather than for its numbers.
        ? `under ${hoursToWords(bucket.to_hours)}`
        : `${hoursToWords(bucket.from_hours)}–${hoursToWords(bucket.to_hours)}`;

    return {
      label,
      count: bucket.count,
      // Each share is the honest rounding of its own band, deliberately not
      // adjusted to make the column total exactly 100 — a reader can check 12.5%
      // against the count beside it, and this is a shape, not a budget.
      pct: Math.round((bucket.count / total) * 1000) / 10,
    };
  });
}
