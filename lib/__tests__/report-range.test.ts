import { describe, expect, it } from 'vitest';
import { isoDay, rangeToParams } from '@/lib/report-range';

describe('isoDay', () => {
  it('formats the LOCAL date, not the UTC one', () => {
    // 00:30 local on the 2nd is still the 1st in UTC for anyone behind it.
    // toISOString().slice(0,10) would return the wrong day and quietly ask the
    // API for a different range than the user picked.
    const localMidnightish = new Date(2026, 5, 2, 0, 30);

    expect(isoDay(localMidnightish)).toBe('2026-06-02');
  });

  it('zero-pads month and day', () => {
    expect(isoDay(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('rangeToParams', () => {
  it('sends the preset window when no dates are picked', () => {
    expect(rangeToParams({ window: 30 })).toEqual({ window: 30 });
  });

  it('sends explicit dates instead of the window, matching BE precedence', () => {
    // The BE ignores `window` when `start` is present; sending both would imply
    // the window still applies.
    expect(rangeToParams({ window: 30, start: '2026-06-01', end: '2026-06-15' }))
      .toEqual({ start: '2026-06-01', end: '2026-06-15' });
  });

  it('omits end so the BE can default it to today', () => {
    expect(rangeToParams({ window: 7, start: '2026-06-01' }))
      .toEqual({ start: '2026-06-01', end: undefined });
  });
});
