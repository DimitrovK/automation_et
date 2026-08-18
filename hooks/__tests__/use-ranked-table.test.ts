import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useRankedTable } from '@/hooks/use-ranked-table';

type Ordering = 'big' | 'small' | 'name';

/** A toggle standing in for a real one, so the generic rules are what is tested. */
const toggle = (current: Ordering, column: string): Ordering => {
  if (column === 'name') {
    return 'name';
  }
  return current === 'big' ? 'small' : 'big';
};

const setup = () => renderHook(() => useRankedTable<Ordering>({ defaultOrdering: 'big', toggle }));

describe('useRankedTable', () => {
  it('starts on the first page with the given default ordering', () => {
    const { result } = setup();

    expect(result.current.page).toBe(1);
    expect(result.current.ordering).toBe('big');
    expect(result.current.search).toBe('');
  });

  it('goes back to page 1 when the page size changes', () => {
    // Otherwise page 40 of 441 becomes page 40 of 45 — the backend clamps to
    // the last page, so you land somewhere you did not ask for and the table
    // looks like it jumped.
    const { result } = setup();

    act(() => result.current.setPage(40));
    act(() => result.current.setPageSize(100));

    expect(result.current.pageSize).toBe(100);
    expect(result.current.page).toBe(1);
  });

  it('goes back to page 1 when the sort changes', () => {
    // Page 12 of one ordering has nothing to do with page 12 of another.
    const { result } = setup();

    act(() => result.current.setPage(12));
    act(() => result.current.sortBy('name'));

    expect(result.current.ordering).toBe('name');
    expect(result.current.page).toBe(1);
  });

  it('goes back to page 1 when the search changes', () => {
    // A filter that matches four rows has no page 12 at all.
    const { result } = setup();

    act(() => result.current.setPage(12));
    act(() => result.current.setSearch('inter'));

    expect(result.current.search).toBe('inter');
    expect(result.current.page).toBe(1);
  });

  it('still lets the paginator move between pages', () => {
    const { result } = setup();

    act(() => result.current.setPage(3));

    expect(result.current.page).toBe(3);
  });

  it('routes sorting through the caller-supplied toggle', () => {
    // The two tables disagree about what a second press on a column means, and
    // that is the only thing they disagree about.
    const { result } = setup();

    act(() => result.current.sortBy('size'));

    expect(result.current.ordering).toBe('small');
  });

  it('gives one identity string covering everything the request depends on', () => {
    // `use-report` refetches on this value. Leave any of the four out and that
    // control stops refetching — the sort button goes dead, or paging shows
    // page one again.
    const { result } = setup();
    const start = result.current.requestKey;

    act(() => result.current.setPage(2));

    expect(result.current.requestKey).not.toBe(start);

    const afterPage = result.current.requestKey;
    act(() => result.current.setPageSize(25));

    expect(result.current.requestKey).not.toBe(afterPage);

    const afterSize = result.current.requestKey;
    act(() => result.current.sortBy('name'));

    expect(result.current.requestKey).not.toBe(afterSize);

    const afterSort = result.current.requestKey;
    act(() => result.current.setSearch('inter'));

    expect(result.current.requestKey).not.toBe(afterSort);
  });
});
