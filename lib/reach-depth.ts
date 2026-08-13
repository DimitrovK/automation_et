/**
 * Reach against depth, per game.
 *
 * The games table ranks by volume, and volume hides the most useful thing in
 * it: two games with similar session counts can have opposite problems. Quiz
 * reached 227 players who played 7.2 times each; Team Ties reached 77 who
 * played 38.6 times each. One has an audience it isn't holding, the other has
 * devotion it isn't spreading — and no view in Reports contrasted them, so both
 * read as "mid-table".
 *
 * Pure, because the quadrant a game lands in is a claim about it and claims are
 * what should be tested.
 */

import type { GameTotals } from '@/types/reports';

export type Quadrant = 'broad_and_deep' | 'broad_shallow' | 'small_devoted' | 'quiet';

export type ReachDepthPoint = {
  game_type: string;
  /** Distinct players in the window — how many people the game reached. */
  reach: number;
  /** Sessions per player — how much each of them played it. */
  depth: number;
  sessions: number;
  quadrant: Quadrant;
};

export type ReachDepth = {
  points: ReachDepthPoint[];
  /** Crosshairs. Medians, not means: one runaway game would drag a mean. */
  medianReach: number;
  medianDepth: number;
};

export const QUADRANT_LABELS: Record<Quadrant, string> = {
  broad_and_deep: 'Broad and deep',
  broad_shallow: 'Broad but shallow',
  small_devoted: 'Small but devoted',
  quiet: 'Quiet',
};

export function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Games with players, split into quadrants at the medians.
 *
 * A game nobody played is excluded rather than plotted at the origin: it would
 * sit in "quiet" and drag both medians down, making every other game look
 * better than it is.
 *
 * Strictly-greater-than counts as the high side, so a game sitting exactly on
 * the median line falls to the modest quadrant. With an odd number of games one
 * of them IS the median, and calling that one "broad" would be flattery.
 */
export function reachDepth(rows: GameTotals[]): ReachDepth {
  const played = rows.filter(row => row.distinct_players > 0 && row.sessions_per_player !== null);
  const medianReach = median(played.map(row => row.distinct_players));
  const medianDepth = median(played.map(row => row.sessions_per_player as number));

  const points = played.map((row) => {
    const reach = row.distinct_players;
    const depth = row.sessions_per_player as number;
    const broad = reach > medianReach;
    const deep = depth > medianDepth;
    return {
      game_type: row.game_type,
      reach,
      depth,
      sessions: row.games_started,
      quadrant: (broad && deep
        ? 'broad_and_deep'
        : broad
          ? 'broad_shallow'
          : deep
            ? 'small_devoted'
            : 'quiet') as Quadrant,
    };
  });

  return { points, medianReach, medianDepth };
}

/**
 * The two games furthest apart in shape, named.
 *
 * A quadrant chart is only as useful as the sentence someone takes away from
 * it, and the pair worth reading is the widest-reach-shallowest against the
 * narrowest-deepest — the two opposite problems the platform actually has.
 * Returns null when there aren't two games to contrast.
 */
export function reachDepthContrast(points: ReachDepthPoint[]): { broadest: ReachDepthPoint; deepest: ReachDepthPoint } | null {
  if (points.length < 2) {
    return null;
  }
  const broadest = points.reduce((a, b) => (b.reach > a.reach ? b : a));
  const deepest = points.reduce((a, b) => (b.depth > a.depth ? b : a));
  return broadest.game_type === deepest.game_type ? null : { broadest, deepest };
}
