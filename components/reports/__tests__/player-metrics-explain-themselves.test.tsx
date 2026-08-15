import type { GameTotals, Pulse } from '@/types/reports';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GameLeaderboard } from '@/components/reports/panels/GameLeaderboard';
import { PulseTiles } from '@/components/reports/panels/PulseTiles';

/**
 * Player-level figures have to be discoverable as player-level figures.
 *
 * `distinct_players` and `sessions_per_player` deliberately leave anonymous play
 * out (App#1476): every anonymous session belongs to one shared account, so
 * counting it would read hundreds of people as one. On production that account
 * was the biggest "player" on the platform — 2,234 sessions in 30 days against
 * 792 for the busiest real player.
 *
 * So both numbers are LOWER than a reader expects, for a reason they cannot
 * possibly infer from the figure. `MetricInfo` renders the backend glossary's
 * `excludes` text in place; these assert the affordance is actually there.
 *
 * Asserted on the RENDER, not on the source. The first version of this test
 * scanned files for the metric name and passed happily when the glossary key was
 * stripped — the name still appeared as a data key on the same line. A guard
 * that survives the mutation it exists to catch is worse than no guard.
 *
 * `MetricInfo` labels its trigger `What "<label or key>" means`, and with no
 * glossary provider mounted the definition is undefined, so the key itself is
 * the accessible name. That is what these look for.
 */
function pulseMetric(today: number) {
  return {
    today,
    baseline_same_weekday: today,
    baseline_full_day: today,
    change_pct: 0,
  } as never;
}

const PULSE = {
  date: '2026-08-15',
  weekday: 'Saturday',
  baseline_weeks: 4,
  baseline_covered: true,
  baseline_missing_days: [],
  elapsed_share: 1,
  metrics: {
    games_started: pulseMetric(120),
    games_finished: pulseMetric(90),
    distinct_players: pulseMetric(40),
    mp_player_sessions: pulseMetric(12),
  },
} as unknown as Pulse;

const META = {
  grid: { key: 'grid', label: 'Grid', display_name: 'Grid', color: '#f97316', color_dark: '#fdba74' },
} as never;

const ROW = {
  game_type: 'grid',
  games_started: 120,
  games_finished: 90,
  distinct_players: 40,
  sessions_per_player: 3,
  mp_player_sessions: 12,
  repeat_players: 8,
  repeat_rate_pct: 20,
  share_pct: 50,
  completion_pct: 75,
  previous_games_started: 100,
  trend_pct: 20,
} as unknown as GameTotals;

describe('the Daily Pulse explains its player figure', () => {
  it('offers the definition beside Players', () => {
    render(<PulseTiles pulse={PULSE} />);

    expect(screen.getByLabelText('What "distinct_players" means')).toBeInTheDocument();
  });
});

describe('the game leaderboard explains its player figures', () => {
  it('offers the definition for both, on the expanded row', () => {
    render(
      <GameLeaderboard
        rows={[ROW]}
        meta={META}
        metric="games_started"
        selected="grid"
        onSelect={() => {}}
      />,
    );

    // The detail rows live behind a disclosure, and the `selected` prop is the
    // FILTER, not the disclosure — opening it is the only way to see the figures
    // this is about.
    fireEvent.click(screen.getByRole('button', { expanded: false }));

    expect(screen.getByLabelText('What "distinct_players" means')).toBeInTheDocument();
    expect(screen.getByLabelText('What "sessions_per_player" means')).toBeInTheDocument();
  });
});
