import type { RetentionResponse } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GameRetentionCard } from '@/components/reports/GameRetentionCard';

function summaryCell(pct: number | null, players: number, below = false) {
  return { cohorts_measured: 4, players, returned: 0, pct, ...(below ? { below_threshold: true } : {}) };
}

function data(over: Partial<RetentionResponse> = {}): RetentionResponse {
  return {
    basis: 'first session within the selected range (not first ever)',
    first_cohort_inflated: false,
    offsets: [1, 7, 30],
    summary: { d1: summaryCell(14.2, 226), d7: summaryCell(5.3, 226), d30: summaryCell(0, 226) },
    cohorts: [],
    by_game: [
      { game_type: 'scout', d1: summaryCell(6.1, 33), d7: summaryCell(12.1, 33), d30: summaryCell(null, 33) },
      { game_type: 'quiz', d1: summaryCell(null, 4, true), d7: summaryCell(null, 4, true), d30: summaryCell(null, 4, true) },
    ],
    min_players: 20,
    game_median: { d1: 11, d7: 6.6, d30: null },
    start: '2026-06-15',
    end: '2026-08-13',
    days: 60,
    window: 60,
    game_type: null,
    include_bots: false,
    ...over,
  } as RetentionResponse;
}

describe('gameRetentionCard', () => {
  it('compares against the peer median, not the platform figure', () => {
    // The platform number counts a return to ANY game from different cohorts,
    // so a game can sit either side of it — Scout's 12.1% is above the
    // platform's 5.3%. Comparing to it would be arithmetic between two
    // questions.
    render(<GameRetentionCard data={data()} gameKey="scout" gameLabel="Scout" />);

    expect(screen.getByText('12.1%')).toBeTruthy();
    expect(screen.getByText(/\+5\.5 vs median 6\.6%/)).toBeTruthy();
  });

  it('says why a rate is missing rather than showing a bare dash', () => {
    render(<GameRetentionCard data={data()} gameKey="quiz" gameLabel="Quiz" />);

    // All three offsets are below the threshold for this game, so the reason
    // appears once per offset.
    expect(screen.getAllByText(/only 4 players — too few to state a rate/)).toHaveLength(3);
  });

  it('distinguishes "not yet" from "too few"', () => {
    // Two different facts. Conflating them would have someone chasing a
    // sample-size problem that is really just time.
    render(<GameRetentionCard data={data()} gameKey="scout" gameLabel="Scout" />);

    expect(screen.getByText(/no cohort has reached this day yet/)).toBeTruthy();
  });

  it('says so when there is no peer median to compare with', () => {
    render(<GameRetentionCard data={data({ game_median: { d1: null, d7: null, d30: null } })} gameKey="scout" gameLabel="Scout" />);

    expect(screen.getAllByText(/no peer median to compare with/).length).toBeGreaterThan(0);
  });

  it('renders nothing for a game the response does not carry', () => {
    const { container } = render(<GameRetentionCard data={data()} gameKey="conquest" gameLabel="Conquest" />);

    expect(container.firstChild).toBeNull();
  });
});
