import type { GameTotals } from '@/types/reports';

export type GameSortKey
  = 'games_started' | 'completion_pct' | 'trend_pct' | 'repeat_rate_pct'
    | 'sessions_per_player' | 'median_seconds';

/** A game row with its session length merged in, which lives on another endpoint. */
export type GameRowWithDuration = GameTotals & {
  median_seconds?: number | null;
  /** False for campaign-shaped games — real, but not comparable with a sitting. */
  single_sitting?: boolean | null;
};

/**
 * Rank games by one metric, descending, with unmeasured games last.
 *
 * The null rule is the whole reason this isn't an inline comparator. A null
 * completion rate means nobody played, not that everyone abandoned it — so a
 * null must never be ordered as if it were a low value. Sorting it to the
 * bottom of "worst completion" would state something the data doesn't say.
 */
export function sortGameTotals<T extends GameRowWithDuration>(rows: T[], key: GameSortKey): T[] {
  return [...rows].sort((a, b) => {
    const left = a[key] ?? null;
    const right = b[key] ?? null;
    if (left === null && right === null) {
      return 0;
    }
    if (left === null) {
      return 1;
    }
    if (right === null) {
      return -1;
    }
    return right - left;
  });
}
