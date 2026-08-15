import type { UnfinishedBucket } from '@/types/reports';
import { describe, expect, it } from 'vitest';
import { unfinishedBands } from '@/lib/unfinished-bands';

const BUCKETS: UnfinishedBucket[] = [
  { from_hours: 0, to_hours: 1, count: 10 },
  { from_hours: 1, to_hours: 24, count: 30 },
  { from_hours: 24, to_hours: 168, count: 40 },
  { from_hours: 168, to_hours: null, count: 20 },
];

describe('unfinishedBands', () => {
  it('labels a band from both of its bounds', () => {
    // The bug this exists to prevent: labelling from the ceiling alone reads the
    // 1-24h band as "under 24h", which overlaps the band below it. Both look
    // right on their own, and nothing signals the overlap.
    const labels = unfinishedBands(BUCKETS).map(band => band.label);

    expect(labels).toEqual(['under 1h', '1h–1d', '1d–1w', 'over 1w']);
  });

  it('reads the boundaries from the payload rather than a list of its own', () => {
    // A parallel copy of the boundaries drifts the first time the backend moves
    // one, and the panel is then confidently mislabelled instead of broken.
    const moved = unfinishedBands([
      { from_hours: 0, to_hours: 2, count: 1 },
      { from_hours: 2, to_hours: 48, count: 1 },
    ]);

    expect(moved.map(band => band.label)).toEqual(['under 2h', '2h–2d']);
  });

  it('only uses a coarser unit when the boundary divides into it exactly', () => {
    // The label has to stay a boundary. Dividing by 24 whenever the count merely
    // reaches it turned a 25-hour edge into "1.0416666666666667d" — invisible
    // today because 1/24/168 all divide cleanly, and waiting for the first time
    // one of them moved.
    const bands = unfinishedBands([
      { from_hours: 0, to_hours: 25, count: 1 },
      { from_hours: 25, to_hours: 36, count: 1 },
      { from_hours: 36, to_hours: 48, count: 1 },
      { from_hours: 48, to_hours: 336, count: 1 },
      { from_hours: 336, to_hours: null, count: 1 },
    ]);

    expect(bands.map(band => band.label)).toEqual([
      'under 25h',
      '25h–36h',
      '36h–2d',
      '2d–2w',
      'over 2w',
    ]);
  });

  it('does not call zero a week', () => {
    // `0 % 168 === 0`, so the divisibility check alone labels a band starting at
    // zero "0w". Not reachable from the current payload — the open-ended band
    // starts at the last boundary — but the same shape as the bug above, and
    // that one was also unreachable right up until a boundary moved.
    const bands = unfinishedBands([{ from_hours: 0, to_hours: null, count: 3 }]);

    expect(bands[0].label).toBe('over 0h');
  });

  it('gives each band its own honest rounding', () => {
    const bands = unfinishedBands(BUCKETS);

    expect(bands.map(band => band.pct)).toEqual([10, 30, 40, 20]);
  });

  it('does not adjust shares to make the column total 100', () => {
    // Deliberate: a reader can check a share against the count beside it. Moving
    // a remainder into the last band buys a tidy total at the cost of one band
    // saying something its own numbers do not support.
    const bands = unfinishedBands([
      { from_hours: 0, to_hours: 1, count: 1 },
      { from_hours: 1, to_hours: 24, count: 1 },
      { from_hours: 24, to_hours: null, count: 1 },
    ]);
    const total = bands.reduce((sum, band) => sum + band.pct, 0);

    expect(bands.every(band => band.pct === 33.3)).toBe(true);
    expect(total).toBeCloseTo(99.9);
  });

  it('returns nothing when a game has no unfinished sessions', () => {
    // Not four bands of 0%: an empty pool has no shape, and dividing by zero to
    // draw one would render a row of NaN.
    expect(unfinishedBands(BUCKETS.map(b => ({ ...b, count: 0 })))).toEqual([]);
  });
});
