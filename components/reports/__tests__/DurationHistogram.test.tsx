import type { DurationResponse, DurationRow } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DurationHistogram } from '@/components/reports/DurationHistogram';

const META = {
  team_ties: { key: 'team_ties', label: 'Team Ties Game Sessions', display_name: 'Team Ties', color: '#0d9488' },
  grid: { key: 'grid', label: 'Grid Game Sessions', display_name: 'Grid', color: '#f97316' },
};

function row(over: Partial<DurationRow>): DurationRow {
  return {
    game_type: 'team_ties',
    supported: true,
    reason: null,
    sessions: 100,
    measured: 100,
    coverage_pct: 100,
    median_seconds: 300,
    p90_seconds: 900,
    long_sessions: 0,
    long_sessions_pct: 0,
    single_sitting: true,
    buckets: [
      { under_seconds: 60, count: 10 },
      { under_seconds: 120, count: 60 },
      { under_seconds: null, count: 30 },
    ],
    ...over,
  } as DurationRow;
}

function data(rows: DurationRow[]): DurationResponse {
  return {
    long_session_seconds: 21600,
    games_without_duration: [],
    long_lived_session_games: [],
    longest_single_sitting_game: null,
    rows,
    start: '2026-07-15',
    end: '2026-08-13',
    days: 30,
    window: 30,
    game_type: null,
    include_bots: false,
  } as DurationResponse;
}

describe('durationHistogram card', () => {
  it('draws the bands for the first measurable game', () => {
    render(<DurationHistogram data={data([row({})])} meta={META as never} />);

    expect(screen.getByText('under 1.0m')).toBeTruthy();
    expect(screen.getByText('over 2.0m')).toBeTruthy();
  });

  it('skips a game whose bands are all empty rather than drawing a blank card', () => {
    // A chip in the selector leading to an empty list reads as a broken chart.
    // The backend's bands sum to `measured` today, so this only triggers on a
    // response that breaks that — which is exactly when a component should not
    // be trusting the invariant.
    const empty = row({
      game_type: 'grid',
      buckets: [{ under_seconds: 60, count: 0 }, { under_seconds: null, count: 0 }],
    });
    render(<DurationHistogram data={data([empty, row({})])} meta={META as never} />);

    expect(screen.getByText('Team Ties')).toBeTruthy();
    expect(screen.queryByText('Grid')).toBeNull();
  });

  it('renders nothing when no game has anything to draw', () => {
    const empty = row({ buckets: [{ under_seconds: null, count: 0 }] });
    const { container } = render(<DurationHistogram data={data([empty])} meta={META as never} />);

    expect(container.firstChild).toBeNull();
  });
});
