import type { RetentionResponse } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RetentionByGame } from '@/components/reports/RetentionByGame';

const META = {
  scout: { key: 'scout', label: 'Scout Game Sessions', display_name: 'Scout', color: '#4338ca' },
  career_path: { key: 'career_path', label: 'CareerPath Game Sessions', display_name: 'Career Path', color: '#6d28d9' },
  quiz: { key: 'quiz', label: 'Quizzes Played', display_name: 'Quiz', color: '#3b82f6' },
};

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
      { game_type: 'scout', d1: summaryCell(6.1, 33), d7: summaryCell(12.1, 33), d30: summaryCell(0, 33) },
      { game_type: 'career_path', d1: summaryCell(15.9, 88), d7: summaryCell(1.1, 88), d30: summaryCell(0, 88) },
      { game_type: 'quiz', d1: summaryCell(null, 3, true), d7: summaryCell(null, 3, true), d30: summaryCell(null, 3, true) },
    ],
    min_players: 20,
    game_median: { d1: 11, d7: 6.6, d30: 0 },
    start: '2026-06-15',
    end: '2026-08-13',
    days: 60,
    window: 60,
    game_type: null,
    include_bots: false,
    ...over,
  } as RetentionResponse;
}

describe('retentionByGame', () => {
  it('shows each game measured on its own players', () => {
    // The finding the platform average hides: Career Path has a strong first
    // day and nothing after it, which is a different problem from a game
    // nobody starts.
    render(<RetentionByGame data={data()} meta={META as never} />);

    expect(screen.getByText('12.1%')).toBeTruthy();
    expect(screen.getByText('15.9%')).toBeTruthy();
    expect(screen.getByText('1.1%')).toBeTruthy();
  });

  it('says these do not decompose the platform figure', () => {
    // Scout's 12.1% sits ABOVE a platform 5.3%: the cohorts are different
    // people, so treating one as a share of the other is arithmetic between
    // two questions.
    render(<RetentionByGame data={data()} meta={META as never} />);

    expect(screen.getByText(/don't sum to the platform figure/)).toBeTruthy();
  });

  it('withholds a rate for too small a sample and explains the dash', () => {
    render(<RetentionByGame data={data()} meta={META as never} />);

    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThan(0);
    expect(dashes[0].getAttribute('title')).toBe('Only 3 players — too few to state a rate');
    expect(screen.getByText(/fewer than 20 measurable players/)).toBeTruthy();
  });

  it('carries the peer median as the reference, not the platform number', () => {
    render(<RetentionByGame data={data()} meta={META as never} />);

    expect(screen.getByText('Median across games')).toBeTruthy();
    expect(screen.getByText('6.6%')).toBeTruthy();
  });

  it('renders a dash for an offset the rows do not carry', () => {
    // The response lists which offsets exist; a row can still be missing one.
    // Reading through it must blank that cell, not the whole table.
    render(<RetentionByGame data={data({
      offsets: [1, 7, 30, 90],
      game_median: { d1: 11, d7: 6.6, d30: 0, d90: null },
    })} meta={META as never} />);

    expect(screen.getByText('12.1%')).toBeTruthy();
    expect(screen.getAllByText('—').length).toBeGreaterThan(3);
  });

  it('reads the cohort size from whichever offset the row carries', () => {
    // Taking it from the first offset LISTED would report a cohort of zero for
    // a game that plainly has players, because the row need not carry that one.
    render(<RetentionByGame data={data({
      by_game: [{ game_type: 'scout', d7: summaryCell(12.1, 33), d30: summaryCell(0, 33) }],
    })} meta={META as never} />);

    expect(screen.getByText('33')).toBeTruthy();
  });

  it('renders nothing when the backend predates the per-game view', () => {
    // The platform table still stands on its own; a blank card would read as
    // a failure.
    const { container } = render(<RetentionByGame data={data({ by_game: undefined })} meta={META as never} />);

    expect(container.firstChild).toBeNull();
  });
});
