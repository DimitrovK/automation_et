import type { SeasonReport } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SeasonChecklist } from '@/components/seasons/SeasonChecklist';
import { SeasonGameStrip } from '@/components/seasons/SeasonGameStrip';

const game = { counted: 0, size: 0, min_games: 1, leader: '—', page: 'https://extratime.world/leaderboard/x', archive: '' };
const report = {
  season: { number: 1, name: 'Season 1 - December 2026' },
  timing: 'Day 3 of 35 · ends in 32d',
  games: [
    { ...game, game_key: 'line-up', stats_key: 'missing11', label: 'Line-Up', counted: 412, size: 37, leader: 'alamsyach (217)' },
    { ...game, game_key: 'quiz', stats_key: 'quiz', label: 'Quiz', counted: 9 },
  ],
} as unknown as SeasonReport;

describe('season insights', () => {
  it('shows a game its own season row, matched by its /games key', () => {
    render(<SeasonGameStrip report={report} gameKey="missing11" />);

    expect(screen.getByText('412')).toBeInTheDocument();
    expect(screen.getByText('alamsyach (217)')).toBeInTheDocument();
    expect(screen.queryByText('9')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Season page' })).toHaveAttribute('href', '/reports/season?season=1');
  });

  it('links only the open checklist steps to the Django admin', () => {
    render(
      <SeasonChecklist checks={[
        { label: 'Champion pictures', done: false, detail: '0 of 12 set', link: 'https://api.extratime.world/admin/x/', link_text: 'Set them' },
        { label: 'Public', done: true, detail: 'Public', link: 'https://api.extratime.world/admin/y/', link_text: 'Audience' },
      ]}
      />,
    );

    expect(screen.getByRole('link', { name: 'Set them' })).toHaveAttribute('href', 'https://api.extratime.world/admin/x/');
    expect(screen.queryByRole('link', { name: 'Audience' })).not.toBeInTheDocument();
  });
});
