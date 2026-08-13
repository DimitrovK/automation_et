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
  /** Share of measured sessions, 0..100. */
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
