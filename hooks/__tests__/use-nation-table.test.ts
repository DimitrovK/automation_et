import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { nextNationOrdering, useNationTable } from '@/hooks/use-nation-table';

describe('nextNationOrdering', () => {
  it('toggles the footballers column between most and fewest', () => {
    expect(nextNationOrdering('footballers', 'footballers')).toBe('footballers_asc');
    expect(nextNationOrdering('footballers_asc', 'footballers')).toBe('footballers');
  });

  it('comes back to most-footballers first when arriving from the name column', () => {
    expect(nextNationOrdering('name', 'footballers')).toBe('footballers');
  });

  it('has only one direction for the name column', () => {
    // The endpoint declares `name` and no reverse, so a Z–A toggle would be a
    // control that silently does nothing every second press.
    expect(nextNationOrdering('footballers', 'name')).toBe('name');
    expect(nextNationOrdering('name', 'name')).toBe('name');
  });
});

describe('useNationTable', () => {
  it('starts with the deepest nations first', () => {
    const { result } = renderHook(() => useNationTable());

    expect(result.current.ordering).toBe('footballers');
    expect(result.current.page).toBe(1);
  });

  it('sorts through the nation toggle', () => {
    const { result } = renderHook(() => useNationTable());

    act(() => result.current.sortBy('footballers'));

    expect(result.current.ordering).toBe('footballers_asc');
  });
});
