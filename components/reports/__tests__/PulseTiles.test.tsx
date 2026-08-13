import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PulseTiles } from '@/components/reports/PulseTiles';

function metric(today: number, byNow: number | null, fullDay: number | null, delta: number | null) {
  return {
    today,
    yesterday: 0,
    baseline_same_weekday: byNow,
    baseline_full_day: fullDay,
    delta_pct_vs_baseline: delta,
  };
}

function pulse(elapsed: number) {
  return {
    date: '2026-08-13',
    weekday: 'Thursday',
    baseline_weeks: 4,
    baseline_covered: true,
    baseline_missing_days: [],
    elapsed_share: elapsed,
    metrics: {
      games_started: metric(275, 274.4, 548.8, 0.2),
      games_finished: metric(122, 206.1, 412.2, -40.8),
      distinct_players: metric(27, 24.6, 49.2, 9.8),
      mp_player_sessions: metric(0, 18.2, 36.5, -100),
    },
  };
}

describe('pulseTiles', () => {
  it('states what it compared, mid-day', () => {
    // The comparison used to weigh today-so-far against four COMPLETE weekdays,
    // so every metric read as down all morning — and nothing on screen said what
    // was being compared, which is what let that survive unnoticed.
    render(<PulseTiles pulse={pulse(0.5) as never} />);

    expect(screen.getByText(/Today so far, against the same 50% of a typical day/)).toBeTruthy();
  });

  it('says "by now" on the baseline, not just "typical Thursday"', () => {
    render(<PulseTiles pulse={pulse(0.5) as never} />);

    expect(screen.getAllByText(/typical Thursday by now/).length).toBeGreaterThan(0);
  });

  it('shows the whole-day figure too, which answers a different question', () => {
    // "On track for X" is not the same question as "normal so far".
    render(<PulseTiles pulse={pulse(0.5) as never} />);

    expect(screen.getByText('Full Thursday: 548.8')).toBeTruthy();
  });

  it('drops the basis line once the day is complete', () => {
    // At the end of the day the comparison is whole against whole, so the
    // explanation would be noise.
    render(<PulseTiles pulse={pulse(1) as never} />);

    expect(screen.queryByText(/Today so far, against/)).toBeNull();
    expect(screen.queryByText(/Full Thursday:/)).toBeNull();
  });
});
