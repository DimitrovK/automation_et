import type { GameTotals } from '@/types/reports';
import { describe, expect, it } from 'vitest';
import { median, reachDepth, reachDepthContrast } from '@/lib/reach-depth';

function game(key: string, players: number, perPlayer: number | null, started = 100): GameTotals {
  return {
    game_type: key,
    games_started: started,
    games_finished: started,
    distinct_players: players,
    mp_player_sessions: 0,
    completion_pct: 100,
    sessions_per_player: perPlayer,
    share_pct: 10,
    repeat_players: 0,
    repeat_rate_pct: null,
    previous_games_started: 0,
    trend_pct: null,
  };
}

describe('median', () => {
  it('averages the middle pair on an even count', () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it('is unmoved by an outlier that would drag a mean', () => {
    // The whole reason the crosshairs are medians: one runaway game must not
    // re-label every other game around it.
    expect(median([5, 6, 7, 900])).toBe(6.5);
  });

  it('is 0 for nothing rather than NaN', () => {
    expect(median([])).toBe(0);
  });
});

describe('reachDepth', () => {
  const ROWS = [
    game('quiz', 227, 7.2),
    game('team_ties', 77, 38.6),
    game('grid', 150, 20),
    game('scout', 40, 3),
    game('conquest', 300, 44),
  ];

  it('puts a wide shallow game and a small devoted one in opposite quadrants', () => {
    // The pair that motivated the view: ranked by volume they read the same.
    const { points } = reachDepth(ROWS);
    const by = Object.fromEntries(points.map(p => [p.game_type, p.quadrant]));

    expect(by.quiz).toBe('broad_shallow');
    expect(by.team_ties).toBe('small_devoted');
    expect(by.conquest).toBe('broad_and_deep');
    expect(by.scout).toBe('quiet');
  });

  it('splits at the medians, not the means', () => {
    const { medianReach, medianDepth } = reachDepth(ROWS);

    expect(medianReach).toBe(150);
    expect(medianDepth).toBe(20);
  });

  it('drops a game nobody played rather than plotting it at the origin', () => {
    // It would land in "quiet" and drag both medians down, making every other
    // game look better than it is. Zero players with a zero rate, not a null
    // one — the null case is caught by the other half of the filter, so this
    // is the row that actually exercises this guard.
    const { points, medianReach } = reachDepth([...ROWS, game('empty', 0, 0, 0)]);

    expect(points.map(p => p.game_type)).not.toContain('empty');
    expect(medianReach).toBe(150);
  });

  it('drops a game with players but no sessions-per-player figure', () => {
    const { points } = reachDepth([...ROWS, game('unknown', 12, null)]);

    expect(points.map(p => p.game_type)).not.toContain('unknown');
  });

  it('calls a game sitting exactly on the median modest, not broad', () => {
    // With an odd number of games one of them IS the median. Rounding that one
    // up to "broad and deep" is flattery, and the quadrant is a claim.
    const { points } = reachDepth(ROWS);

    expect(points.find(p => p.game_type === 'grid')?.quadrant).toBe('quiet');
  });

  it('survives a single game', () => {
    const { points, medianReach } = reachDepth([game('grid', 10, 2)]);

    expect(points).toHaveLength(1);
    expect(medianReach).toBe(10);
    expect(points[0].quadrant).toBe('quiet');
  });
});

describe('reachDepthContrast', () => {
  it('names the widest-reaching and the most-played-per-person', () => {
    const { points } = reachDepth([game('quiz', 227, 7.2), game('team_ties', 77, 38.6)]);
    const contrast = reachDepthContrast(points);

    expect(contrast?.broadest.game_type).toBe('quiz');
    expect(contrast?.deepest.game_type).toBe('team_ties');
  });

  it('says nothing when one game is both', () => {
    // "X reaches the most players and X is played most per person" is not a
    // contrast, and printing it as one would be filler.
    const { points } = reachDepth([game('quiz', 227, 40), game('scout', 20, 2)]);

    expect(reachDepthContrast(points)).toBeNull();
  });

  it('says nothing with fewer than two games', () => {
    expect(reachDepthContrast([])).toBeNull();
  });
});
