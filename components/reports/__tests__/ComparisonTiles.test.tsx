import type { PeriodComparison } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ComparisonTiles } from '@/components/reports/ComparisonTiles';

function metric(current: number, previous: number, pct: number | null) {
  return { current, previous, change: current - previous, change_pct: pct };
}

function comparison(over: Partial<PeriodComparison> = {}): PeriodComparison {
  return {
    current: { start: '2026-08-08', end: '2026-08-14', days: 7 },
    previous: { start: '2026-08-01', end: '2026-08-07', days: 7 },
    compare_offset: 1,
    same_length: true,
    coverage: { complete: true, missing_current_days: [], missing_previous_days: [] },
    metrics: {
      games_started: metric(200, 400, -50),
      games_finished: metric(120, 240, -50),
      distinct_players: metric(30, 40, -25),
      mp_player_sessions: metric(10, 20, -50),
    },
    ...over,
  };
}

describe('comparisonTiles', () => {
  it('says which period it compared against, not just "previous"', () => {
    // "-50% vs previous" against a period three back is the kind of wrong that
    // looks right, because the label was written when the comparison could
    // only ever be the preceding period.
    render(<ComparisonTiles comparison={comparison({
      compare_offset: 3,
      previous: { start: '2026-07-18', end: '2026-07-24', days: 7 },
    })} />);

    expect(screen.getAllByText(/vs 3 periods back/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/vs previous$/)).toBeNull();
  });

  it('still says "previous" for the immediately preceding period', () => {
    render(<ComparisonTiles comparison={comparison()} />);

    expect(screen.getAllByText(/vs previous/).length).toBeGreaterThan(0);
  });

  it('describes a named period as one the reader chose', () => {
    // No offset describes it, and printing "1 period back" would be a lie.
    render(<ComparisonTiles comparison={comparison({
      compare_offset: null,
      previous: { start: '2026-01-01', end: '2026-01-07', days: 7 },
    })} />);

    expect(screen.getByText(/a period you named/)).toBeTruthy();
  });

  it('explains a withheld percentage when the periods differ in length', () => {
    // Without this the tiles read as broken: four numbers and no movement,
    // with nothing saying why.
    render(<ComparisonTiles comparison={comparison({
      same_length: false,
      previous: { start: '2026-05-01', end: '2026-05-30', days: 30 },
      metrics: {
        games_started: metric(200, 900, null),
        games_finished: metric(120, 540, null),
        distinct_players: metric(30, 90, null),
        mp_player_sessions: metric(10, 45, null),
      },
    })} />);

    // The TILES must say it, not only the footer: a chip reading "incomplete
    // data" would send someone to run a backfill that changes nothing. Matched
    // exactly so the footer sentence can't satisfy this on its own.
    expect(screen.getAllByText('periods differ in length').length).toBe(4);
    expect(screen.queryByText('incomplete data')).toBeNull();
    expect(screen.getByText(/describes the calendar, not the platform/)).toBeTruthy();
  });

  it('keeps saying "incomplete data" when that is the actual reason', () => {
    // Two different reasons for a missing percentage; conflating them would
    // send someone to run a backfill that changes nothing.
    render(<ComparisonTiles comparison={comparison({
      coverage: { complete: false, missing_current_days: ['2026-08-10'], missing_previous_days: [] },
      metrics: {
        games_started: metric(200, 400, null),
        games_finished: metric(120, 240, null),
        distinct_players: metric(30, 40, null),
        mp_player_sessions: metric(10, 20, null),
      },
    })} />);

    expect(screen.getAllByText(/incomplete data/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/periods differ in length/)).toBeNull();
  });

  it('reads a backend predating the field as the immediately preceding period', () => {
    // null and undefined mean different things: null is a period the reader
    // named, undefined is a backend that only ever compared with the period
    // before. Conflating them captions a legacy response "a period you named",
    // which nobody did.
    const { compare_offset: _dropped, ...legacy } = comparison();
    render(<ComparisonTiles comparison={legacy as PeriodComparison} />);

    expect(screen.getAllByText(/vs previous/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/a period you named/)).toBeNull();
  });
});
