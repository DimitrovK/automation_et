import type { GameTotals } from '@/types/reports';
import { describe, expect, it } from 'vitest';
import { abandonedSessions, sessionsPerPoint } from '@/lib/abandoned';

function game(key: string, started: number, finished: number): GameTotals {
  return {
    game_type: key,
    games_started: started,
    games_finished: finished,
    distinct_players: 50,
    mp_player_sessions: 0,
    completion_pct: started > 0 ? Math.round((finished / started) * 1000) / 10 : null,
    sessions_per_player: 2,
    share_pct: 10,
    repeat_players: 0,
    repeat_rate_pct: null,
    previous_games_started: 0,
    trend_pct: null,
  };
}

describe('abandonedSessions', () => {
  it('ranks by the size of the pool, not by the completion rate', () => {
    // The finding this exists for: missing11 at 61.7% reads as mid-table beside
    // a game at 40%, but it is a quarter of all play, so its pool is far
    // larger. A rate ranking buries exactly the game worth working on.
    const { rows } = abandonedSessions([
      game('missing11', 8440, 5207), // 61.7% — 3,233 abandoned
      game('tiny', 80, 32), //           40.0% —    48 abandoned
    ]);

    expect(rows.map(r => r.game_type)).toEqual(['missing11', 'tiny']);
    expect(rows[0].abandoned).toBe(3233);
  });

  it('reports each pool as a share of all abandonment', () => {
    const { rows, totalAbandoned } = abandonedSessions([game('a', 100, 30), game('b', 100, 70)]);

    expect(totalAbandoned).toBe(100);
    expect(rows[0].share_of_abandoned_pct).toBe(70);
    expect(rows[1].share_of_abandoned_pct).toBe(30);
  });

  it('names a lever only when one game genuinely dominates', () => {
    const clear = abandonedSessions([game('big', 1000, 100), game('small', 100, 90)]);
    expect(clear.lever?.game_type).toBe('big');
  });

  it('names no lever at exactly the margin', () => {
    // "Within five points" has to include five, or the boundary case is decided
    // by which side of it the arithmetic happens to land on.
    const { rows, lever } = abandonedSessions([game('a', 105, 0), game('b', 95, 0)]);

    expect(rows[0].share_of_abandoned_pct - rows[1].share_of_abandoned_pct).toBe(5);
    expect(lever).toBeNull();
  });

  it('decides on the raw shares, not the rounded ones', () => {
    // 5248 against 4752 is a 4.96-point gap — under the margin. Displayed, it
    // rounds to 52.5 and 47.5, which reads as exactly 5.0; deciding on those
    // would name a lever off a rounding artefact.
    const { lever } = abandonedSessions([game('a', 5248, 0), game('b', 4752, 0)]);

    expect(lever).toBeNull();
  });

  it('names a lever once the gap clears the margin', () => {
    const { lever } = abandonedSessions([game('a', 106, 0), game('b', 94, 0)]);

    expect(lever?.game_type).toBe('a');
  });

  it('names no lever when the top two are close', () => {
    // 51% against 49% is a coin toss. Calling one of them "the" lever would
    // dress it up as a finding.
    const { lever } = abandonedSessions([game('a', 102, 0), game('b', 98, 0)]);

    expect(lever).toBeNull();
  });

  it('leaves out games with nothing abandoned', () => {
    // A perfect game is not a small pool; it is not a pool.
    const { rows } = abandonedSessions([game('perfect', 40, 40), game('leaky', 40, 10)]);

    expect(rows.map(r => r.game_type)).toEqual(['leaky']);
  });

  it('never reports a negative pool', () => {
    // Sessions finished in the window can start before it, so finished can
    // exceed started at a range boundary. That is a reporting artefact, not
    // negative abandonment.
    const { rows, totalAbandoned } = abandonedSessions([game('boundary', 10, 14)]);

    expect(rows).toEqual([]);
    expect(totalAbandoned).toBe(0);
  });

  it('has nothing to say about an empty window', () => {
    const { rows, totalAbandoned, lever } = abandonedSessions([]);

    expect(rows).toEqual([]);
    expect(totalAbandoned).toBe(0);
    expect(lever).toBeNull();
  });
});

describe('sessionsPerPoint', () => {
  it('is arithmetic on this window, offered as a unit of comparison', () => {
    // Two points on 8,440 sessions is worth more than ten points on 80 — which
    // is the entire point of showing it.
    const { rows } = abandonedSessions([game('missing11', 8440, 5207), game('tiny', 80, 32)]);

    expect(sessionsPerPoint(rows[0], 2)).toBe(169);
    expect(sessionsPerPoint(rows[1], 10)).toBe(8);
  });
});
