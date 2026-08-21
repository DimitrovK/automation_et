import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { nextContentOrdering, useCareerPathTable } from '@/hooks/use-career-path-table';

describe('nextContentOrdering', () => {
  it('toggles needed-help between its two ends', () => {
    expect(nextContentOrdering('help', 'help')).toBe('help_asc');
    expect(nextContentOrdering('help_asc', 'help')).toBe('help');
  });

  it('gives every other column its one interesting direction', () => {
    // A toggle whose second press does nothing is worse than a plain sort.
    expect(nextContentOrdering('help', 'plays')).toBe('plays');
    expect(nextContentOrdering('plays', 'plays')).toBe('plays');
    expect(nextContentOrdering('help', 'unfinished')).toBe('unfinished');
    expect(nextContentOrdering('help', 'name')).toBe('name');
  });
});

describe('useCareerPathTable', () => {
  it('starts on the most-helped footballers, which is what the panel is for', () => {
    const { result } = renderHook(() => useCareerPathTable());

    expect(result.current.ordering).toBe('help');
    expect(result.current.page).toBe(1);
  });

  it('resets to page 1 when the search changes', () => {
    const { result } = renderHook(() => useCareerPathTable());

    act(() => result.current.setPage(4));
    act(() => result.current.setSearch('sirigu'));

    expect(result.current.page).toBe(1);
  });
});
