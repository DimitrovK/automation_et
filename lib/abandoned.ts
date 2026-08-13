/**
 * Where the unfinished sessions are.
 *
 * Reports already carry every number this needs, and none of them says the
 * thing worth acting on: missing11 runs at 61.7% completion, which reads as
 * mid-table beside games at 55%, but it is a quarter of all play — so its
 * abandoned sessions are the largest single pool on the platform by a distance.
 * A completion-rate column ranks by rate and buries that; a volume column ranks
 * by volume and buries it too.
 *
 * The lever is the absolute pool, not the rate. Fixing a 40% completion rate on
 * a game with 80 sessions recovers fewer sessions than a two-point improvement
 * on the big one.
 */

import type { GameTotals } from '@/types/reports';

export type AbandonedRow = {
  game_type: string;
  /** Sessions started and not finished, in the window. */
  abandoned: number;
  started: number;
  completion_pct: number | null;
  /** This game's share of every unfinished session on the platform. */
  share_of_abandoned_pct: number;
};

export type AbandonedSummary = {
  rows: AbandonedRow[];
  totalAbandoned: number;
  /**
   * The game with the largest pool, when it is genuinely the largest — null
   * when nothing is abandoned, or when the top two are within a few points of
   * each other and calling one of them "the" lever would be arbitrary.
   */
  lever: AbandonedRow | null;
};

/**
 * How much clear water the top game needs over the second before it is worth
 * naming as *the* lever. Within this — including exactly this — they are two
 * comparable pools and the ranked list already says so.
 */
const LEVER_MARGIN_PCT = 5;

export function abandonedSessions(games: GameTotals[]): AbandonedSummary {
  const rows = games
    .map(game => ({
      game_type: game.game_type,
      abandoned: game.games_started - game.games_finished,
      started: game.games_started,
      completion_pct: game.completion_pct,
      share_of_abandoned_pct: 0,
    }))
    // `> 0`, not `!== 0`: a game can finish more sessions than it started in a
    // window, because a session finishing today may have started before it.
    // That is a range-boundary artefact, not negative abandonment, and it must
    // not subtract from the total.
    .filter(row => row.abandoned > 0)
    .sort((a, b) => b.abandoned - a.abandoned);

  const totalAbandoned = rows.reduce((sum, row) => sum + row.abandoned, 0);
  for (const row of rows) {
    row.share_of_abandoned_pct = totalAbandoned > 0
      ? Math.round((row.abandoned / totalAbandoned) * 1000) / 10
      : 0;
  }

  // Compared on the raw shares, and strictly: the displayed percentages are
  // rounded to 0.1, so a 4.96-point gap prints as 52.5 against 47.5 and a
  // >= test on those would name a lever off a rounding artefact. "Within five
  // points" has to include exactly five, or the boundary case is decided by
  // which side of it the arithmetic happens to land.
  const [first, second] = rows;
  const share = (row: AbandonedRow) => (totalAbandoned > 0 ? (row.abandoned / totalAbandoned) * 100 : 0);
  const clear = !second || share(first) - share(second) > LEVER_MARGIN_PCT;

  return { rows, totalAbandoned, lever: first && clear ? first : null };
}

/**
 * Sessions a completion-rate improvement would recover, on this window's
 * volume.
 *
 * Plain arithmetic, deliberately: started x points. It is offered as a unit of
 * comparison between games — "two points here is worth ten points there" — not
 * as a forecast, because nothing here knows whether those points are reachable.
 */
export function sessionsPerPoint(row: AbandonedRow, points: number): number {
  return Math.round(row.started * (points / 100));
}
