import type { ActivityDay } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ActivityChart } from '@/components/reports/charts/ActivityChart';

function day(date: string): ActivityDay {
  return {
    date,
    covered: true,
    games_started: 120,
    games_finished: 90,
    distinct_players: 40,
    mp_player_sessions: 12,
  };
}

const PROPS = {
  series: [day('2026-08-25'), day('2026-08-26')],
  title: 'All games — last 30 days',
  description: 'test',
  metric: 'games_started' as const,
  granularity: 'day' as const,
  onGranularityChange: () => {},
};

describe('ActivityChart grid layout', () => {
  it('renders all four metrics as equal panels with their totals', () => {
    render(<ActivityChart {...PROPS} layout="grid" />);

    for (const label of ['Played', 'Finished', 'Players', 'Multiplayer']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    // Totals ride each panel header: played summed across the two days.
    expect(screen.getByText('240')).toBeInTheDocument();
  });

  it('keeps the primary layout by default', () => {
    render(<ActivityChart {...PROPS} />);

    // In primary layout the selected metric is NOT a small panel header —
    // only the three context metrics carry the muted header treatment.
    expect(screen.queryByText('Played')).not.toBeInTheDocument();
    expect(screen.getByText('Finished')).toBeInTheDocument();
  });
});
