import type { WeeklyPulse } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WeeklyPulseTiles } from '@/components/reports/panels/WeeklyPulseTiles';

function pulse(over: Partial<WeeklyPulse> = {}): WeeklyPulse {
  return {
    start: '2026-06-24',
    end: '2026-06-30',
    baseline_weeks: 4,
    baseline_covered: true,
    baseline_missing_days: [],
    metrics: {
      games_started: { current: 3250, baseline: 4359, delta_pct: -25.4 },
      distinct_players: { current: 115, baseline: 341.8, delta_pct: -66.3 },
    },
    ...over,
  };
}

describe('weeklyPulseTiles', () => {
  it('shows the week against what a week usually looks like', () => {
    render(<WeeklyPulseTiles pulse={pulse()} />);

    expect(screen.getByText('3,250')).toBeInTheDocument();
    expect(screen.getByText('-25.4%')).toBeInTheDocument();
    expect(screen.getByText('vs 4,359 usual')).toBeInTheDocument();
  });

  it('says today is left out, because that is why the number can be trusted', () => {
    // The daily pulse has to scale its baseline by how much of the day has
    // elapsed. A window of finished days needs no such correction, and that is
    // half the reason this leads.
    render(<WeeklyPulseTiles pulse={pulse()} />);

    expect(screen.getByText(/Today is deliberately left out/)).toBeInTheDocument();
  });

  it('withholds the comparison rather than averaging over uncomputed days', () => {
    // Averaging over days the rollup never ran divides real activity by four and
    // calls the result typical — it once produced "+100% vs usual" from nothing.
    render(
      <WeeklyPulseTiles
        pulse={pulse({
          baseline_covered: false,
          baseline_missing_days: ['2026-06-10'],
          metrics: {
            games_started: { current: 3250, baseline: null, delta_pct: null },
          },
        })}
      />,
    );

    expect(screen.getByText('no baseline')).toBeInTheDocument();
    expect(screen.getByText(/withheld rather than averaged over gaps/)).toBeInTheDocument();
  });

  it('says "level" rather than 0%, which reads as a measurement of nothing', () => {
    render(
      <WeeklyPulseTiles
        pulse={pulse({
          metrics: { games_started: { current: 3250, baseline: 3250, delta_pct: 0 } },
        })}
      />,
    );

    expect(screen.getByText('level')).toBeInTheDocument();
  });

  it('names the window it covers and how far back it compares', () => {
    render(<WeeklyPulseTiles pulse={pulse()} />);

    expect(screen.getByText(/2026-06-24 to 2026-06-30/)).toBeInTheDocument();
    expect(screen.getByText(/mean of the 4 weeks before/)).toBeInTheDocument();
  });
});
