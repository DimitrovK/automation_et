import type { GameTotals } from '@/types/reports';
import { describe, expect, it } from 'vitest';
import { sortGameTotals } from '@/lib/report-sort';

function game(game_type: string, overrides: Partial<GameTotals> = {}): GameTotals {
  return {
    game_type,
    games_started: 0,
    games_finished: 0,
    distinct_players: 0,
    mp_player_sessions: 0,
    completion_pct: null,
    sessions_per_player: null,
    share_pct: null,
    repeat_players: 0,
    repeat_rate_pct: null,
    previous_games_started: 0,
    trend_pct: null,
    ...overrides,
  } as GameTotals;
}

describe('sortGameTotals', () => {
  it('ranks descending', () => {
    const rows = [game('a', { games_started: 5 }), game('b', { games_started: 50 })];

    expect(sortGameTotals(rows, 'games_started').map(r => r.game_type)).toEqual(['b', 'a']);
  });

  it('puts unmeasured games last, not bottom of the ranking', () => {
    // The bug this prevents: a game nobody played has a null completion rate.
    // Treating null as 0 ranks it below a genuinely abandoned game, asserting
    // it is the worst performer when nothing was measured at all.
    const rows = [
      game('unplayed', { completion_pct: null }),
      game('abandoned', { completion_pct: 3 }),
      game('healthy', { completion_pct: 80 }),
    ];

    expect(sortGameTotals(rows, 'completion_pct').map(r => r.game_type))
      .toEqual(['healthy', 'abandoned', 'unplayed']);
  });

  it('keeps unmeasured games last even when every measured value is negative', () => {
    // A null must not drift above real values just because they're below zero.
    const rows = [
      game('unmeasured', { trend_pct: null }),
      game('falling', { trend_pct: -60 }),
      game('slipping', { trend_pct: -5 }),
    ];

    expect(sortGameTotals(rows, 'trend_pct').map(r => r.game_type))
      .toEqual(['slipping', 'falling', 'unmeasured']);
  });

  it('does not mutate the input', () => {
    const rows = [game('a', { games_started: 1 }), game('b', { games_started: 9 })];
    sortGameTotals(rows, 'games_started');

    expect(rows.map(r => r.game_type)).toEqual(['a', 'b']);
  });

  it('handles an all-null column without reordering arbitrarily', () => {
    const rows = [game('a'), game('b'), game('c')];

    expect(sortGameTotals(rows, 'repeat_rate_pct').map(r => r.game_type)).toEqual(['a', 'b', 'c']);
  });
});
