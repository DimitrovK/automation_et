import type { ReportParams, ReportWindow } from '@/types/reports';

/**
 * The windows that render as a number of days. 1 is excluded because it is the
 * "Today" button — offering it as "1d" as well would be one range under two
 * names.
 */
export type NumericWindow = Exclude<ReportWindow, 1>;

/** A selected reporting range: a preset window, or explicit dates. */
export type RangeState = {
  window: ReportWindow;
  /** YYYY-MM-DD. When set, takes precedence over `window`. */
  start?: string;
  end?: string;
};

/**
 * Local YYYY-MM-DD.
 *
 * Deliberately not `toISOString().slice(0, 10)`: that converts to UTC first, so
 * anyone behind UTC gets yesterday's date for the first hours of their day —
 * which would quietly ask the API for the wrong range.
 */
export function isoDay(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Yesterday, as an explicit single-day range.
 *
 * Explicit dates rather than a second window value: "yesterday" is a shifted
 * day, and a `window` only ever counts back from today. The backend already
 * resolves start=end, so this needs nothing new there.
 *
 * `window` is carried along unchanged so clearing the range returns to whatever
 * preset was selected before, rather than to a default nobody chose.
 */
export function yesterdayRange(today: Date, window: ReportWindow): RangeState {
  const date = new Date(today);
  date.setDate(date.getDate() - 1);
  const day = isoDay(date);
  return { window, start: day, end: day };
}

/**
 * Which preset a range corresponds to, if any.
 *
 * The picker has to answer this to show what is selected, and getting it wrong
 * is the kind of bug nobody reports: two buttons lit, or none, while the data
 * is correct. Named presets are checked before numeric ones because "today" is
 * also `window: 1`.
 */
export function activePreset(range: RangeState, today: Date): 'today' | 'yesterday' | 'custom' | NumericWindow {
  if (range.start) {
    const yesterday = yesterdayRange(today, range.window);
    return range.start === yesterday.start && range.end === yesterday.end ? 'yesterday' : 'custom';
  }
  return range.window === 1 ? 'today' : (range.window as NumericWindow);
}

/** Query params for a range — explicit dates win, exactly as the BE resolves them. */
export function rangeToParams(range: RangeState): ReportParams {
  return range.start ? { start: range.start, end: range.end } : { window: range.window };
}

/**
 * Query params for the comparison the summary should make.
 *
 * Explicit dates win, exactly as the BE resolves them — sending both would
 * imply the offset still applied, and it doesn't. The default offset is
 * omitted rather than sent as 1: an unchanged default has no business in a
 * request or in a shared URL.
 */
export function compareToParams(
  compareOffset: number,
  compareStart?: string,
  compareEnd?: string,
): { compare_offset?: number; compare_start?: string; compare_end?: string } {
  if (compareStart) {
    return { compare_start: compareStart, ...(compareEnd ? { compare_end: compareEnd } : {}) };
  }
  return compareOffset === 1 ? {} : { compare_offset: compareOffset };
}
