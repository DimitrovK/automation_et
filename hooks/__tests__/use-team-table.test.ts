import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { nextOrdering, useTeamTable } from '@/hooks/use-team-table';

// The page/size/sort/search rules these two tables share live in
// `use-ranked-table` and are tested there. What is left here is the one thing
// the teams table decides for itself: what a second press on a column means.

describe('nextOrdering', () => {
  it('toggles the players column between most and fewest', () => {
    expect(nextOrdering('players', 'players')).toBe('players_asc');
    expect(nextOrdering('players_asc', 'players')).toBe('players');
  });

  it('comes back to most-players first when arriving from the name column', () => {
    // "Sort by players" from a standing start should mean the interesting end.
    expect(nextOrdering('name', 'players')).toBe('players');
  });

  it('has only one direction for the name column', () => {
    // The endpoint declares `name` and no reverse, so offering a Z–A toggle
    // would be a control that silently does nothing every second press.
    expect(nextOrdering('name', 'name')).toBe('name');
    expect(nextOrdering('players', 'name')).toBe('name');
  });
});

describe('useTeamTable', () => {
  it('starts on the first page, biggest squads first', () => {
    const { result } = renderHook(() => useTeamTable());

    expect(result.current.page).toBe(1);
    expect(result.current.ordering).toBe('players');
    expect(result.current.search).toBe('');
  });

  it('sorts through the team toggle', () => {
    const { result } = renderHook(() => useTeamTable());

    act(() => result.current.sortBy('players'));

    expect(result.current.ordering).toBe('players_asc');
  });
});
