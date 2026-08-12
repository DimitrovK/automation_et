import type { MultiplayerModeRow } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ModeBreakdown } from '@/components/reports/ModeBreakdown';

const META = {
  grid: { key: 'grid', label: 'Grid', color: '#10b981' },
  quiz: { key: 'quiz', label: 'Quiz', color: '#2563eb' },
};

const ROWS: MultiplayerModeRow[] = [
  { game_type: 'grid', mode: 'ELIMINATION', rooms_created: 40, rooms_started: 30, rooms_finished: 25 },
  { game_type: 'quiz', mode: 'ELIMINATION', rooms_created: 10, rooms_started: 4, rooms_finished: 2 },
  { game_type: 'grid', mode: 'TIME_ATTACK', rooms_created: 20, rooms_started: 18, rooms_finished: 15 },
  // Quiz has no mode column server-side, so its rooms arrive as null.
  { game_type: 'quiz', mode: null, rooms_created: 5, rooms_started: 5, rooms_finished: 5 },
];

describe('modeBreakdown', () => {
  it('totals a mode across the games that share it', () => {
    // The reason this view exists: "is Elimination working anywhere" can't be
    // read off a per-game table, because each game only shows its own slice.
    render(<ModeBreakdown rows={ROWS} meta={META} />);

    expect(screen.getByText('50 rooms · 34 started')).toBeInTheDocument();
  });

  it('keeps modeless rooms visible instead of dropping them', () => {
    // A null mode is real activity. Filtering it out would quietly shrink the
    // totals and make them disagree with the multiplayer tiles above.
    render(<ModeBreakdown rows={ROWS} meta={META} />);

    expect(screen.getByText('No mode')).toBeInTheDocument();
  });

  it('orders modes by volume so the biggest is read first', () => {
    render(<ModeBreakdown rows={ROWS} meta={META} />);
    const headings = screen.getAllByRole('heading', { level: 4 }).map(h => h.textContent);

    expect(headings).toEqual(['Elimination', 'Time Attack', 'No mode']);
  });

  it('lets a game badge drive the page filter', async () => {
    const onSelectGame = vi.fn();
    render(<ModeBreakdown rows={ROWS} meta={META} onSelectGame={onSelectGame} />);

    await userEvent.click(screen.getAllByText('Grid')[0]);

    expect(onSelectGame).toHaveBeenCalledWith('grid');
  });

  it('says there are no rooms rather than rendering an empty chart', () => {
    render(<ModeBreakdown rows={[]} meta={META} />);

    expect(screen.getByText(/no multiplayer rooms in this window/i)).toBeInTheDocument();
  });
});
