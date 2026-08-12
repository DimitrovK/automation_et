import type { ReportParams, ReportWindow } from '@/types/reports';

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

/** Query params for a range — explicit dates win, exactly as the BE resolves them. */
export function rangeToParams(range: RangeState): ReportParams {
  return range.start ? { start: range.start, end: range.end } : { window: range.window };
}
