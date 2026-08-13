import type { DurationResponse, DurationRow } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DurationTable } from '@/components/reports/DurationTable';

const META = {
  conquest: { key: 'conquest', label: 'Football Conquest Game Sessions', display_name: 'Football Conquest', color: '#38bdf8', color_dark: '#7dd3fc' },
  team_ties: { key: 'team_ties', label: 'Team Ties Game Sessions', display_name: 'Team Ties', color: '#0d9488', color_dark: '#0d9488' },
};

function row(over: Partial<DurationRow>): DurationRow {
  return {
    game_type: 'team_ties',
    supported: true,
    reason: null,
    sessions: 40,
    measured: 40,
    coverage_pct: 100,
    median_seconds: 330,
    p90_seconds: 900,
    long_sessions: 0,
    long_sessions_pct: 0,
    single_sitting: true,
    ...over,
  };
}

function response(rows: DurationRow[]): DurationResponse {
  return {
    long_session_seconds: 21600,
    games_without_duration: [],
    long_lived_session_games: rows.filter(r => r.single_sitting === false).map(r => r.game_type),
    longest_single_sitting_game: 'team_ties',
    rows,
    start: '2026-08-01',
    end: '2026-08-13',
    days: 13,
    window: 13,
    game_type: null,
    include_bots: false,
  };
}

const SWEPT = row({
  game_type: 'conquest',
  median_seconds: 86400,
  p90_seconds: 90000,
  long_sessions: 29,
  long_sessions_pct: 72.5,
  single_sitting: false,
  long_reason: 'idle_sweep',
  idle_finish_seconds: 86400,
  swept_sessions: 29,
  swept_pct: 72.5,
  median_excluding_swept_seconds: 480,
});

describe('durationTable long-lived section', () => {
  it('says a swept game is swept, not that it is long by design', () => {
    // The old copy asserted "spans a day or more by design" for every long
    // game. For Conquest that turned a housekeeping job into a finding about
    // attention.
    render(<DurationTable data={response([row({}), SWEPT])} meta={META as never} />);

    expect(screen.getByText('Idle sweep')).toBeTruthy();
    expect(screen.getByText(/72.5% of measured sessions were closed after 24h idle/)).toBeTruthy();
    expect(screen.queryByText(/by design/)).toBeNull();
  });

  it('shows the median among sessions that played out', () => {
    // 24h is the sweeper's clock; 8 minutes is the game.
    render(<DurationTable data={response([row({}), SWEPT])} meta={META as never} />);

    expect(screen.getByText('8.0m')).toBeTruthy();
  });

  it('does not explain a long game the backend has not classified', () => {
    // A deploy window: no long_reason yet. Saying nothing beats guessing which
    // of two opposite explanations applies.
    const unexplained = row({ game_type: 'conquest', median_seconds: 86400, single_sitting: false });
    render(<DurationTable data={response([row({}), unexplained])} meta={META as never} />);

    expect(screen.queryByText('Idle sweep')).toBeNull();
    expect(screen.queryByText('Long play')).toBeNull();
  });

  it('leaves the comparable table alone', () => {
    render(<DurationTable data={response([row({}), SWEPT])} meta={META as never} />);

    expect(screen.getByText('How long a session lasts')).toBeTruthy();
    expect(screen.getByText('5.5m')).toBeTruthy();
  });
});
