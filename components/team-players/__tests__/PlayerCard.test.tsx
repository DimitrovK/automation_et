import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlayerCard } from '@/components/team-players/PlayerCard';
import type { TeamPlayerRow } from '@/types/team';

function row(overrides: Partial<TeamPlayerRow> = {}): TeamPlayerRow {
  return {
    id: 1,
    footballer_id: 42,
    full_name: 'Cristiano Ronaldo',
    nation_id: 1,
    nation_name: 'Portugal',
    nation_short: 'POR',
    retired: false,
    career_path_difficulty: 'EASY',
    role: 'player',
    start_year: 2003,
    end_year: 2009,
    apps: 196,
    goals: 84,
    transfer_type: 'permanent',
    ...overrides,
  };
}

describe('PlayerCard', () => {
  afterEach(cleanup);

  it('renders name, nation, year range, apps and goals for a player', () => {
    render(<PlayerCard player={row()} />);
    expect(screen.getByText('Cristiano Ronaldo')).toBeInTheDocument();
    expect(screen.getByText(/Portugal \(POR\)/)).toBeInTheDocument();
    expect(screen.getByText('2003 – 2009')).toBeInTheDocument();
    expect(screen.getByText('196 apps')).toBeInTheDocument();
    expect(screen.getByText('84 goals')).toBeInTheDocument();
    expect(screen.getByText('permanent')).toBeInTheDocument();
  });

  it('renders the footballer id under the name', () => {
    render(<PlayerCard player={row({ footballer_id: 1234 })} />);
    expect(screen.getByText('#1234')).toBeInTheDocument();
  });

  it('shows "present" when end_year is null (active stint)', () => {
    render(<PlayerCard player={row({ end_year: null })} />);
    expect(screen.getByText(/2003 – present/)).toBeInTheDocument();
  });

  it('marks retired players', () => {
    render(<PlayerCard player={row({ retired: true })} />);
    expect(screen.getByText(/retired/)).toBeInTheDocument();
  });

  it('hides apps/goals/transfer for managers', () => {
    render(<PlayerCard player={row({ role: 'manager' })} />);
    expect(screen.getByText('manager')).toBeInTheDocument();
    expect(screen.queryByText(/apps/)).not.toBeInTheDocument();
    expect(screen.queryByText(/goals/)).not.toBeInTheDocument();
    expect(screen.queryByText('permanent')).not.toBeInTheDocument();
  });

  it('renders an em dash when both years are null', () => {
    render(<PlayerCard player={row({ start_year: null, end_year: null })} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  // ---- edit button ------------------------------------------------------

  it('hides the edit button when no onEdit handler is supplied', () => {
    render(<PlayerCard player={row()} />);
    expect(screen.queryByRole('button', { name: /Edit/ })).not.toBeInTheDocument();
  });

  it('shows the edit button and calls onEdit with the footballer id when supplied', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<PlayerCard player={row({ footballer_id: 4242 })} onEdit={onEdit} />);

    const button = screen.getByRole('button', { name: /Edit Cristiano Ronaldo/ });
    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(onEdit).toHaveBeenCalledWith(4242);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});
