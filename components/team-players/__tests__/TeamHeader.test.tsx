import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { TeamHeader } from '@/components/team-players/TeamHeader';
import type { TeamHeaderInfo } from '@/types/team';

const baseTeam: TeamHeaderInfo = {
  id: 7,
  name: 'AC Milan',
  nation_name: 'Italy',
  nation_short: 'ITA',
  founding_year: 1899,
  parent_team_name: null,
  total_players: 245,
  total_managers: 30,
};

describe('TeamHeader', () => {
  afterEach(cleanup);

  it('renders team name, nation, founding year, and counts', () => {
    render(<TeamHeader team={baseTeam} />);
    expect(screen.getByText('AC Milan')).toBeInTheDocument();
    expect(screen.getByText(/Italy/)).toBeInTheDocument();
    expect(screen.getByText(/founded 1899/)).toBeInTheDocument();
    expect(screen.getByTestId('players-count')).toHaveTextContent('245 players');
    expect(screen.getByTestId('managers-count')).toHaveTextContent('30 managers');
  });

  it('shows parent team when present', () => {
    render(
      <TeamHeader team={{ ...baseTeam, name: 'Milan B', parent_team_name: 'AC Milan' }} />,
    );
    expect(screen.getByText(/part of AC Milan/)).toBeInTheDocument();
  });

  it('falls back gracefully when nation/founding year are missing', () => {
    render(
      <TeamHeader
        team={{ ...baseTeam, nation_name: null, nation_short: null, founding_year: null }}
      />,
    );
    expect(screen.getByText(/Unknown nation/)).toBeInTheDocument();
    expect(screen.queryByText(/founded/)).not.toBeInTheDocument();
  });
});
