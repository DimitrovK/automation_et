import type { GroupedPlayer } from '@/types/team';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GroupedPlayerTable } from '@/components/roster/GroupedPlayerTable';

function player(over: Partial<GroupedPlayer> = {}): GroupedPlayer {
  return {
    footballer_id: 5,
    full_name: 'Peter Shilton',
    nation_id: 1,
    nation_name: 'England',
    nation_short: 'ENG',
    retired: true,
    career_path_difficulty: 'NORMAL',
    spell_count: 2,
    total_apps: 1005,
    total_goals: 0,
    first_year: 1966,
    last_year: 1996,
    open_spells: 0,
    spells: [
      { id: 1, footballer_id: 5, full_name: 'Peter Shilton', team_id: 9, team_name: 'Leicester City', role: 'player', start_year: 1966, end_year: 1974, apps: 286, goals: 0, transfer_type: 'permanent' },
      { id: 2, footballer_id: 5, full_name: 'Peter Shilton', team_id: 10, team_name: 'Stoke City', role: 'player', start_year: 1974, end_year: 1977, apps: 719, goals: 0, transfer_type: 'permanent' },
    ],
    ...over,
  } as unknown as GroupedPlayer;
}

describe('groupedPlayerTable', () => {
  it('is one row per person, however many clubs', () => {
    // Eleven rows of the same name is a list of contracts, not a list of players.
    render(<GroupedPlayerTable players={[player()]} />);

    expect(screen.getAllByText('Peter Shilton')).toHaveLength(1);
    expect(screen.getByText('2 clubs')).toBeInTheDocument();
  });

  it('keeps the clubs shut until asked', () => {
    render(<GroupedPlayerTable players={[player()]} />);

    expect(screen.queryByText('1966')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Show the clubs/ }));

    expect(screen.getAllByText(/1966/).length).toBeGreaterThan(0);
  });

  it('offers no expander for a single club', () => {
    // A control that reveals one row the summary already described wastes a click.
    render(<GroupedPlayerTable players={[player({ spell_count: 1, spells: [player().spells[0]] })]} />);

    expect(screen.queryByRole('button', { name: /Show the clubs/ })).not.toBeInTheDocument();
    expect(screen.getByText('1 club')).toBeInTheDocument();
  });

  it('shows the span of years and the summed totals', () => {
    // "Most apps in England" is every English club added together.
    render(<GroupedPlayerTable players={[player()]} />);

    expect(screen.getByText('1966–1996')).toBeInTheDocument();
    expect(screen.getByText('1,005')).toBeInTheDocument();
  });

  it('says plainly when nothing matches', () => {
    render(<GroupedPlayerTable players={[]} emptyLabel="No spell in this country matches." />);

    expect(screen.getByText('No spell in this country matches.')).toBeInTheDocument();
  });
});

describe('groupedPlayerTable expansion', () => {
  it('names the clubs, which is the only reason to open the row', () => {
    // It used to render five rows of "Armando Broja ALB player" with nothing
    // to tell them apart: the serializer never sent the team, and the table it
    // reuses was built for a page where every row is the same club.
    render(<GroupedPlayerTable players={[player()]} />);

    fireEvent.click(screen.getByRole('button', { name: /Show the clubs/ }));

    expect(screen.getByText('Leicester City')).toBeInTheDocument();
    expect(screen.getByText('Stoke City')).toBeInTheDocument();
  });

  it('drops the player and nation columns inside the group', () => {
    // Every row is the same person — the row above already said who.
    render(<GroupedPlayerTable players={[player()]} />);

    fireEvent.click(screen.getByRole('button', { name: /Show the clubs/ }));

    expect(screen.getByRole('columnheader', { name: 'Club' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Player' })).not.toBeInTheDocument();
  });

  it('marks a footballer who is at a club here now', () => {
    // An open spell — no end year — is a different fact from not having retired.
    render(<GroupedPlayerTable players={[player({ open_spells: 1, retired: false })]} />);

    expect(screen.getByText('Still there')).toBeInTheDocument();
  });

  it('says nothing about being there when every spell has ended', () => {
    render(<GroupedPlayerTable players={[player({ open_spells: 0 })]} />);

    expect(screen.queryByText('Still there')).not.toBeInTheDocument();
  });
});
