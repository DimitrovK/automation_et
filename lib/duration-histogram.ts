/**
 * Session-length bands, ready to draw.
 *
 * The backend sends counts per band with the last one open-ended
 * (`under_seconds: null`). Turning those into labels is the part worth testing:
 * a band mislabelled by one boundary describes a different game, and the chart
 * gives no hint that it happened.
 */

import type { DurationRow } from '@/types/reports';
import { formatDuration } from '@/lib/format-duration';

export type HistogramBand = {
  /** "1–2m", "over 6h" — what the band covers, in words. */
  label: string;
  count: number;
  /**
   * This band's share of measured sessions, rounded on its own.
   *
   * Deliberately NOT adjusted to make the column total exactly 100: each figure
   * is the honest rounding of its own band, so a reader can check 12.5% against
   * the count beside it. Shifting a remainder into the last band would buy a
   * tidy total at the cost of one band saying something its own numbers don't
   * support — and this is a shape, not a budget.
   */
  pct: number;
};

/**
 * Bands with human labels and shares.
 *
 * Labels come from the boundaries the backend chose, not from a parallel list
 * here: a second copy would drift the first time a boundary moved, and the
 * chart would be confidently mislabelled rather than obviously broken.
 */
export function durationHistogram(row: DurationRow): HistogramBand[] {
  const buckets = row.buckets ?? [];
  const total = buckets.reduce((sum, bucket) => sum + bucket.count, 0);
  if (total === 0) {
    return [];
  }

  let previous: number | null = null;
  return buckets.map((bucket) => {
    const label = bucket.under_seconds === null
      ? `over ${formatDuration(previous ?? 0)}`
      : previous === null
        ? `under ${formatDuration(bucket.under_seconds)}`
        : `${formatDuration(previous)}–${formatDuration(bucket.under_seconds)}`;
    previous = bucket.under_seconds;
    return {
      label,
      count: bucket.count,
      pct: Math.round((bucket.count / total) * 1000) / 10,
    };
  });
}
