import type { GameTotals } from '@/types/reports';

export type GameSortKey
  = 'games_started' | 'completion_pct' | 'trend_pct' | 'repeat_rate_pct' | 'sessions_per_player';

/**
 * Rank games by one metric, descending, with unmeasured games last.
 *
 * The null rule is the whole reason this isn't an inline comparator. A null
 * completion rate means nobody played, not that everyone abandoned it — so a
 * null must never be ordered as if it were a low value. Sorting it to the
 * bottom of "worst completion" would state something the data doesn't say.
 */
export function sortGameTotals(rows: GameTotals[], key: GameSortKey): GameTotals[] {
  return [...rows].sort((a, b) => {
    const left = a[key];
    const right = b[key];
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
