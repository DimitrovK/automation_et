import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { nextOrdering, useTeamTable } from '@/hooks/use-team-table';

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

  it('goes back to page 1 when the page size changes', () => {
    // Otherwise page 40 of 441 becomes page 40 of 45 — the backend clamps to
    // the last page, so you land somewhere you did not ask for and the table
    // looks like it jumped.
    const { result } = renderHook(() => useTeamTable());

    act(() => result.current.setPage(40));
    act(() => result.current.setLimit(100));

    expect(result.current.limit).toBe(100);
    expect(result.current.page).toBe(1);
  });

  it('goes back to page 1 when the sort changes', () => {
    // Page 12 of one ordering has nothing to do with page 12 of another.
    const { result } = renderHook(() => useTeamTable());

    act(() => result.current.setPage(12));
    act(() => result.current.sortBy('name'));

    expect(result.current.ordering).toBe('name');
    expect(result.current.page).toBe(1);
  });

  it('goes back to page 1 when the search changes', () => {
    // A filter that matches four teams has no page 12 at all.
    const { result } = renderHook(() => useTeamTable());

    act(() => result.current.setPage(12));
    act(() => result.current.setSearch('inter'));

    expect(result.current.search).toBe('inter');
    expect(result.current.page).toBe(1);
  });

  it('still lets the paginator move between pages', () => {
    const { result } = renderHook(() => useTeamTable());

    act(() => result.current.setPage(3));

    expect(result.current.page).toBe(3);
  });

  it('gives one identity string covering everything the request depends on', () => {
    // `use-report` refetches on this value. Leave any of the four out and that
    // control stops refetching — the sort button goes dead, or paging shows
    // page one again.
    const { result } = renderHook(() => useTeamTable());
    const first = result.current.requestKey;

    act(() => result.current.setPage(2));

    expect(result.current.requestKey).not.toBe(first);

    act(() => result.current.setLimit(25));
    const afterLimit = result.current.requestKey;

    act(() => result.current.sortBy('name'));

    expect(result.current.requestKey).not.toBe(afterLimit);

    const afterSort = result.current.requestKey;
    act(() => result.current.setSearch('inter'));

    expect(result.current.requestKey).not.toBe(afterSort);
  });
});
