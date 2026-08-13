import type { PatternsResponse } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GameHourProfile } from '@/components/reports/GameHourProfile';

function hours(counts: Partial<Record<number, number>>) {
  return Array.from({ length: 24 }, (_, hour) => ({ hour, games_started: counts[hour] ?? 0 }));
}

function data(over: Partial<PatternsResponse> = {}): PatternsResponse {
  return {
    timezone: 'Europe/Sofia',
    by_hour: hours({ 12: 10, 20: 40, 21: 30, 22: 20 }),
    by_weekday: [],
    by_hour_weekday: [],
    peak_cell: null,
    busiest_cell_games: 0,
    peak_hour: 20,
    peak_weekday: null,
    new_vs_returning: [],
    start: '2026-07-15',
    end: '2026-08-13',
    days: 30,
    window: 30,
    game_type: 'grid',
    include_bots: false,
    ...over,
  } as PatternsResponse;
}

describe('gameHourProfile', () => {
  it('names the busiest hour and its share of the game\'s own play', () => {
    // Share, not raw count: a popular game and a quiet one have the same shape
    // question, and counts would make every small game look flat.
    render(<GameHourProfile data={data()} gameLabel="Grid" />);

    expect(screen.getByText('20:00')).toBeTruthy();
    expect(screen.getByText(/40% of its sessions start in that hour/)).toBeTruthy();
  });

  it('states the timezone the hours are in', () => {
    // "8pm" means nothing without it, and the platform buckets in Sofia time.
    render(<GameHourProfile data={data()} gameLabel="Grid" />);

    expect(screen.getByText(/Europe\/Sofia/)).toBeTruthy();
  });

  it('puts each hour\'s numbers in the accessibility tree, not only in a tooltip', () => {
    // `title` is a hover affordance: unreliable for screen readers, absent on
    // touch. The heatmap and the multiplayer funnel already label their marks;
    // this matches them.
    render(<GameHourProfile data={data()} gameLabel="Grid" />);

    expect(screen.getByLabelText('20:00 — 40 sessions (40%)')).toBeTruthy();
    expect(screen.getByLabelText('Grid sessions by hour, Europe/Sofia')).toBeTruthy();
  });

  it('renders nothing for a game with no play in the window', () => {
    // An all-zero chart is 24 empty bars and a peak hour of midnight — a
    // confident-looking answer to a question with no data behind it.
    const { container } = render(<GameHourProfile data={data({ by_hour: hours({}) })} gameLabel="Grid" />);

    expect(container.firstChild).toBeNull();
  });
});
