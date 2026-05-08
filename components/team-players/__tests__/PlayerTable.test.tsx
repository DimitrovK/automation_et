import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlayerTable } from '@/components/team-players/PlayerTable';
import type { TeamPlayerRow } from '@/types/team';

function row(overrides: Partial<TeamPlayerRow> = {}): TeamPlayerRow {
  return {
    id: 1,
    footballer_id: 42,
    full_name: 'Paolo Maldini',
    nation_id: 3,
    nation_name: 'Italy',
    nation_short: 'ITA',
    retired: true,
    career_path_difficulty: 'NORMAL',
    role: 'player',
    start_year: 1985,
    end_year: 2009,
    apps: 647,
    goals: 29,
    transfer_type: 'permanent',
    ...overrides,
  };
}

describe('PlayerTable', () => {
  afterEach(cleanup);

  it('shows an empty-state message when no players', () => {
    render(<PlayerTable players={[]} />);
    expect(screen.getByText(/No players match/)).toBeInTheDocument();
  });

  it('renders an ID column with the footballer id', () => {
    render(<PlayerTable players={[row({ footballer_id: 4242 })]} />);
    expect(screen.getByText('#4242')).toBeInTheDocument();
    expect(screen.getByText('ID')).toBeInTheDocument();
  });

  it('renders a row per player with key fields', () => {
    render(
      <PlayerTable
        players={[
          row(),
          row({ id: 2, full_name: 'Cristiano Ronaldo', apps: 196, goals: 84 }),
        ]}
      />,
    );

    expect(screen.getByTestId('player-row-1')).toBeInTheDocument();
    expect(screen.getByTestId('player-row-2')).toBeInTheDocument();
    expect(screen.getByText('Paolo Maldini')).toBeInTheDocument();
    expect(screen.getByText('Cristiano Ronaldo')).toBeInTheDocument();
    expect(screen.getByText('647')).toBeInTheDocument();
    expect(screen.getByText('196')).toBeInTheDocument();
    expect(screen.getByText('29')).toBeInTheDocument();
    expect(screen.getByText('84')).toBeInTheDocument();
  });

  it('formats years for active stints', () => {
    render(<PlayerTable players={[row({ end_year: null })]} />);
    expect(screen.getByText(/1985 – present/)).toBeInTheDocument();
  });

  it('renders em dashes for null apps/goals on managers', () => {
    render(
      <PlayerTable
        players={[row({ id: 9, full_name: 'Carlo Ancelotti', role: 'manager', apps: null, goals: null })]}
      />,
    );
    const cells = screen.getAllByText('—');
    expect(cells.length).toBeGreaterThanOrEqual(2);
  });

  // ---- edit button ------------------------------------------------------

  it('does not render an actions column when onEdit is omitted', () => {
    render(<PlayerTable players={[row()]} />);
    expect(screen.queryByRole('button', { name: /Edit/ })).not.toBeInTheDocument();
  });

  it('renders one edit button per row and calls onEdit with the footballer id', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(
      <PlayerTable
        players={[
          row({ id: 1, full_name: 'Paolo Maldini', footballer_id: 11 }),
          row({ id: 2, full_name: 'Cristiano Ronaldo', footballer_id: 22 }),
        ]}
        onEdit={onEdit}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Edit Cristiano Ronaldo/ }));
    expect(onEdit).toHaveBeenCalledWith(22);

    await user.click(screen.getByRole('button', { name: /Edit Paolo Maldini/ }));
    expect(onEdit).toHaveBeenLastCalledWith(11);
    expect(onEdit).toHaveBeenCalledTimes(2);
  });
});
