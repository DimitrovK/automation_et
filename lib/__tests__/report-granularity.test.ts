import type { ActivityDay } from '@/types/reports';
import { describe, expect, it } from 'vitest';
import { aggregateSeries, canAggregate } from '@/lib/report-granularity';

function day(date: string, started: number, players: number, covered = true): ActivityDay {
  return {
    date,
    games_started: started,
    games_finished: started,
    distinct_players: players,
    mp_player_sessions: 0,
    covered,
  } as ActivityDay;
}

describe('canAggregate', () => {
  it('refuses distinct players', () => {
    // Someone playing Monday and Thursday is one player that week, not two.
    // Summing daily distinct counts is what once made a platform total read
    // 5.6x too high, and a weekly count cannot be recovered from daily ones.
    expect(canAggregate('distinct_players')).toBe(false);
  });

  it('allows the metrics that genuinely sum', () => {
    expect(canAggregate('games_started')).toBe(true);
    expect(canAggregate('games_finished')).toBe(true);
    expect(canAggregate('mp_player_sessions')).toBe(true);
  });
});

describe('aggregateSeries', () => {
  const week = [
    day('2026-08-03', 10, 5), // Monday
    day('2026-08-04', 20, 6),
    day('2026-08-05', 30, 7),
    day('2026-08-10', 40, 8), // the following Monday
  ];

  it('sums the additive metrics into weekly buckets', () => {
    const rows = aggregateSeries(week, 'week');

    expect(rows).toHaveLength(2);
    expect(rows[0].games_started).toBe(60);
    expect(rows[1].games_started).toBe(40);
  });

  it('never sums distinct players', () => {
    // The whole point. 5 + 6 + 7 = 18 would be a plausible, wrong number.
    const rows = aggregateSeries(week, 'week');

    expect(rows[0].distinct_players).not.toBe(18);
    expect(rows[0].distinct_players).toBe(7);
  });

  it('buckets weeks from Monday', () => {
    const rows = aggregateSeries(week, 'week');

    expect(rows[0].date).toBe('2026-08-03');
    expect(rows[1].date).toBe('2026-08-10');
  });

  it('marks a bucket uncovered if any day in it was never computed', () => {
    // A gap hidden inside a wider bar is worse than a gap in a daily line —
    // the bar looks like a complete week.
    const rows = aggregateSeries([day('2026-08-03', 10, 5), day('2026-08-04', 20, 6, false)], 'week');

    expect(rows[0].covered).toBe(false);
  });

  it('groups months by calendar month', () => {
    const rows = aggregateSeries([day('2026-07-31', 5, 2), day('2026-08-01', 7, 3)], 'month');

    expect(rows.map(r => r.date)).toEqual(['2026-07-01', '2026-08-01']);
  });

  it('returns the series untouched for daily', () => {
    expect(aggregateSeries(week, 'day')).toBe(week);
  });
});
