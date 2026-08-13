import type { DurationRow } from '@/types/reports';
import { describe, expect, it } from 'vitest';
import { durationHistogram } from '@/lib/duration-histogram';

function row(buckets: DurationRow['buckets']): DurationRow {
  return {
    game_type: 'team_ties',
    supported: true,
    reason: null,
    sessions: 100,
    measured: 100,
    coverage_pct: 100,
    median_seconds: 300,
    p90_seconds: 900,
    long_sessions: 0,
    long_sessions_pct: 0,
    single_sitting: true,
    buckets,
  } as DurationRow;
}

const BANDS = [
  { under_seconds: 60, count: 10 },
  { under_seconds: 120, count: 20 },
  { under_seconds: 300, count: 40 },
  { under_seconds: null, count: 30 },
];

describe('durationHistogram', () => {
  it('labels the first band as an upper bound only', () => {
    // "0s–1m" is noise; nothing starts before zero.
    expect(durationHistogram(row(BANDS))[0].label).toBe('under 1.0m');
  });

  it('labels middle bands from the boundary before them', () => {
    // The labels come from the boundaries the backend sent, not a parallel
    // list here — a second copy would drift the first time a boundary moved
    // and the chart would be confidently mislabelled rather than obviously
    // broken.
    const bands = durationHistogram(row(BANDS));

    expect(bands[1].label).toBe('1.0m–2.0m');
    expect(bands[2].label).toBe('2.0m–5.0m');
  });

  it('labels the open-ended band from the last boundary', () => {
    // This is where a 24-hour session lands, and it must not claim a ceiling.
    expect(durationHistogram(row(BANDS))[3].label).toBe('over 5.0m');
  });

  it('computes each share against the total, so they sum to 100', () => {
    const bands = durationHistogram(row(BANDS));

    expect(bands.map(b => b.pct)).toEqual([10, 20, 40, 30]);
    expect(bands.reduce((sum, b) => sum + b.pct, 0)).toBe(100);
  });

  it('has nothing to draw when nothing was measured', () => {
    // Zero counts across every band would otherwise divide by zero and render
    // NaN% on every row.
    expect(durationHistogram(row([{ under_seconds: 60, count: 0 }, { under_seconds: null, count: 0 }]))).toEqual([]);
  });

  it('has nothing to draw for a backend that predates the bands', () => {
    expect(durationHistogram(row(undefined))).toEqual([]);
  });
});
