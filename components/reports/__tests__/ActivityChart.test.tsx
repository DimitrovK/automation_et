import type { ActivityDay } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ActivityChart } from '@/components/reports/charts/ActivityChart';

function day(date: string, over: Partial<ActivityDay> = {}): ActivityDay {
  return {
    date,
    covered: true,
    games_started: 1000,
    games_finished: 600,
    distinct_players: 30,
    mp_player_sessions: 120,
    ...over,
  };
}

const SERIES = [day('2026-08-01'), day('2026-08-02'), day('2026-08-03')];

function chart(metric: Parameters<typeof ActivityChart>[0]['metric'] = 'games_started') {
  return (
    <ActivityChart
      series={SERIES}
      title="Activity"
      description="Last 3 days."
      metric={metric}
      granularity="day"
      onGranularityChange={() => {}}
    />
  );
}

describe('activityChart', () => {
  it('gives every other metric its own panel', () => {
    // They used to share one y-axis. Distinct players runs in the tens where
    // games played runs in the thousands, so the small series was a flat line
    // along the bottom — and a shared axis also implies the gap between two
    // lines means something, when one counts sessions and the other counts
    // people.
    render(chart('games_started'));

    expect(screen.getByText('Finished')).toBeInTheDocument();
    expect(screen.getByText('Players')).toBeInTheDocument();
    expect(screen.getByText('Multiplayer')).toBeInTheDocument();
  });

  it('does not give the selected metric a second panel', () => {
    // It is already the large chart above; repeating it would imply the two
    // are different measurements.
    render(chart('distinct_players'));

    expect(screen.queryByText('Players')).not.toBeInTheDocument();
    expect(screen.getByText('Played')).toBeInTheDocument();
  });

  it('totals each panel over the window', () => {
    render(chart('games_started'));

    expect(screen.getByText('1,800')).toBeInTheDocument();
    expect(screen.getByText('90')).toBeInTheDocument();
    expect(screen.getByText('360')).toBeInTheDocument();
  });

  it('leaves uncovered days out of a panel total rather than counting them as zero', () => {
    // An uncovered day was never computed. Counting it as zero understates the
    // total and draws a dip that never happened.
    render(
      <ActivityChart
        series={[day('2026-08-01'), day('2026-08-02', { covered: false })]}
        title="Activity"
        description="Two days, one uncovered."
        metric="games_started"
        granularity="day"
        onGranularityChange={() => {}}
      />,
    );

    expect(screen.getByText('600')).toBeInTheDocument();
  });

  it('says how many days were never computed', () => {
    render(
      <ActivityChart
        series={[day('2026-08-01'), day('2026-08-02', { covered: false })]}
        title="Activity"
        description="Two days, one uncovered."
        metric="games_started"
        granularity="day"
        onGranularityChange={() => {}}
      />,
    );

    expect(screen.getByText(/1 day in this range were never computed/)).toBeInTheDocument();
  });
});
