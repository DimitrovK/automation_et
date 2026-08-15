import type { UnfinishedRow } from '@/types/reports';
import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UnfinishedTable } from '@/components/reports/UnfinishedTable';

const META = {
  grid: { key: 'grid', label: 'Grid', display_name: 'Grid', color: '#f97316', color_dark: '#fdba74' },
  conquest: {
    key: 'conquest',
    label: 'Football Conquest',
    display_name: 'Football Conquest',
    color: '#38bdf8',
    color_dark: '#7dd3fc',
  },
} as never;

function row(over: Partial<UnfinishedRow> & Pick<UnfinishedRow, 'game_type'>): UnfinishedRow {
  return {
    unfinished: 0,
    recent_sessions: 0,
    stale_sessions: 0,
    buckets: [],
    sweeper_hours: null,
    ...over,
  };
}

describe('unfinishedTable', () => {
  it('ranks by the stale pool, not by the total', () => {
    // The total includes the last hour, which on a busy game is mostly people
    // currently playing — ranking by it surfaces whichever game is busiest right
    // now, every time you look, which is not something anyone can act on.
    const rows = [
      row({ game_type: 'conquest', unfinished: 12, recent_sessions: 2, stale_sessions: 10 }),
      row({ game_type: 'grid', unfinished: 90, recent_sessions: 88, stale_sessions: 2 }),
    ];

    render(<UnfinishedTable rows={rows} meta={META} />);
    const names = screen.getAllByRole('row').slice(1).map(r => within(r).getAllByRole('cell')[0].textContent);

    // Given in stale order by the API; the component must not re-sort by total.
    expect(names[0]).toContain('Football Conquest');
  });

  it('says on the row when a game sweeps its idle sessions', () => {
    // Conquest closes idle sessions on a timer, so it CANNOT accumulate an old
    // pool. Without this on the row, a reader ranking the table concludes it is
    // the healthiest game on the platform.
    render(
      <UnfinishedTable
        rows={[row({ game_type: 'conquest', unfinished: 5, stale_sessions: 5, sweeper_hours: 24 })]}
        meta={META}
      />,
    );

    expect(screen.getByText('swept after 24h')).toBeInTheDocument();
  });

  it('adds no sweeper note to a game that has none', () => {
    render(
      <UnfinishedTable
        rows={[row({ game_type: 'grid', unfinished: 5, stale_sessions: 5 })]}
        meta={META}
      />,
    );

    expect(screen.queryByText(/swept after/)).not.toBeInTheDocument();
  });

  it('shows the last hour apart from the stale count', () => {
    render(
      <UnfinishedTable
        rows={[row({ game_type: 'grid', unfinished: 30, recent_sessions: 25, stale_sessions: 5 })]}
        meta={META}
      />,
    );
    const cells = within(screen.getAllByRole('row')[1]).getAllByRole('cell');

    expect(cells[1]).toHaveTextContent('5');
    expect(cells[2]).toHaveTextContent('25');
  });

  it('drops games with an empty pool rather than listing them at zero', () => {
    // Eleven rows of 0 is a wall of nothing to read past. A game with no
    // unfinished sessions has nothing to say here.
    render(
      <UnfinishedTable
        rows={[row({ game_type: 'grid', unfinished: 4, stale_sessions: 4 }), row({ game_type: 'conquest' })]}
        meta={META}
      />,
    );

    expect(screen.getAllByRole('row')).toHaveLength(2);
  });

  it('says so when nothing is unfinished at all', () => {
    render(<UnfinishedTable rows={[row({ game_type: 'grid' })]} meta={META} />);

    expect(screen.getByText('Nothing is sitting unfinished.')).toBeInTheDocument();
  });
});
