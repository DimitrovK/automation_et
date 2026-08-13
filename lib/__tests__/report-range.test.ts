import { describe, expect, it } from 'vitest';
import { activePreset, isoDay, rangeToParams, yesterdayRange } from '@/lib/report-range';

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

describe('yesterdayRange', () => {
  it('is an explicit single day, not a window', () => {
    // A window only ever counts back from today, so "yesterday" cannot be one.
    expect(yesterdayRange(new Date(2026, 7, 13, 14, 0), 30)).toEqual({
      window: 30,
      start: '2026-08-12',
      end: '2026-08-12',
    });
  });

  it('crosses a month boundary', () => {
    expect(yesterdayRange(new Date(2026, 7, 1, 9, 0), 7).start).toBe('2026-07-31');
  });

  it('keeps the window it was given', () => {
    // Clearing the custom range returns to whatever preset was selected before,
    // rather than to a default nobody chose.
    expect(yesterdayRange(new Date(2026, 7, 13), 60).window).toBe(60);
  });
});

describe('activePreset', () => {
  const NOW = new Date(2026, 7, 13, 14, 0);

  it('calls a one-day window "today" rather than the number 1', () => {
    // Both buttons would otherwise light up: today IS window 1.
    expect(activePreset({ window: 1 }, NOW)).toBe('today');
  });

  it('recognises yesterday from its explicit dates', () => {
    expect(activePreset({ window: 30, start: '2026-08-12', end: '2026-08-12' }, NOW)).toBe('yesterday');
  });

  it('calls any other explicit range custom', () => {
    expect(activePreset({ window: 30, start: '2026-08-01', end: '2026-08-12' }, NOW)).toBe('custom');
    // A single day that isn't yesterday is still custom — lighting up Yesterday
    // for it would misstate what is on screen.
    expect(activePreset({ window: 30, start: '2026-08-10', end: '2026-08-10' }, NOW)).toBe('custom');
  });

  it('returns the number for a numeric preset', () => {
    expect(activePreset({ window: 30 }, NOW)).toBe(30);
  });
});
