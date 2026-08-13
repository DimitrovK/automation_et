import type { MultiplayerGameRow } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MultiplayerFunnel } from '@/components/reports/MultiplayerFunnel';

const META = { grid: { key: 'grid', label: 'Grid', color: '#f97316', color_dark: '#fdba74' } };

function row(overrides: Partial<MultiplayerGameRow> = {}): MultiplayerGameRow {
  return {
    game_type: 'grid',
    rooms_created: 100,
    rooms_started: 40,
    rooms_finished: 30,
    rooms_cancelled: 0,
    never_started_pct: 60,
    ...overrides,
  } as MultiplayerGameRow;
}

describe('multiplayerFunnel', () => {
  it('states each drop-off rather than leaving you to subtract', () => {
    render(<MultiplayerFunnel rows={[row()]} meta={META} />);

    // 40/100 started, then 30/40 of those finished — the second rate is of the
    // previous stage, not of rooms created, which is the easy thing to get wrong.
    expect(screen.getByText(/40% started/)).toBeTruthy();
    expect(screen.getByText(/75% of those finished/)).toBeTruthy();
  });

  it('says nothing started rather than claiming 0% finished', () => {
    // 0/0 is not 0%. Rendering "0% of those finished" would read as total
    // abandonment when in fact no game ever began.
    render(<MultiplayerFunnel rows={[row({ rooms_started: 0, rooms_finished: 0 })]} meta={META} />);

    expect(screen.getByText(/none started, so nothing to finish/)).toBeTruthy();
    expect(screen.queryByText(/0% of those finished/)).toBeNull();
  });

  it('labels every bar with its count, so the shape is never the only signal', () => {
    render(<MultiplayerFunnel rows={[row()]} meta={META} />);

    expect(screen.getByLabelText('Created: 100 rooms')).toBeTruthy();
    expect(screen.getByLabelText('Started: 40 rooms')).toBeTruthy();
    expect(screen.getByLabelText('Finished: 30 rooms')).toBeTruthy();
  });

  it('drops games with no rooms instead of drawing empty scaffolding', () => {
    render(
      <MultiplayerFunnel
        rows={[row(), row({ game_type: 'quiz', rooms_created: 0, rooms_started: 0, rooms_finished: 0 })]}
        meta={META}
      />,
    );

    expect(screen.queryByLabelText('Created: 0 rooms')).toBeNull();
  });

  it('orders games by volume so the biggest funnel is read first', () => {
    render(
      <MultiplayerFunnel
        rows={[row({ game_type: 'quiz', rooms_created: 10 }), row({ rooms_created: 500 })]}
        meta={META}
      />,
    );

    const counts = screen.getAllByLabelText(/^Created: /).map(n => n.getAttribute('aria-label'));

    expect(counts).toEqual(['Created: 500 rooms', 'Created: 10 rooms']);
  });

  it('says so when there are no rooms at all', () => {
    render(<MultiplayerFunnel rows={[]} meta={META} />);

    expect(screen.getByText(/no multiplayer rooms in this window/i)).toBeTruthy();
  });
});
