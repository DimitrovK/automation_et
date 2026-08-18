import { useCallback, useState } from 'react';

/** Page sizes offered in the dropdown. 100 is the endpoint's own ceiling. */
export const RANKED_PAGE_SIZES = [10, 25, 50, 100] as const;

/**
 * What `aria-sort` should say about a column, given what the server sorted by.
 *
 * Lives beside the hook because it is the other half of the same convention:
 * both tables name their orderings `<column>` for the interesting direction and
 * `<column>_asc` for the other, so one rule covers teams and nations. The
 * exception is `name`, whose single direction is A–Z — reporting it as
 * descending would draw an arrow pointing the wrong way.
 */
export function sortState(ordering: string, column: string) {
  if (ordering === column) {
    return column === 'name' ? ('ascending' as const) : ('descending' as const);
  }
  if (ordering === `${column}_asc`) {
    return 'ascending' as const;
  }
  return undefined;
}

/**
 * Everything a server-ordered table's request is made of, and the rule that
 * keeps them consistent: anything that changes WHICH rows exist resets to
 * page one.
 *
 * That rule is why this is a hook rather than four `useState` calls in a page.
 * Page 40 of 441 is not page 40 of 45, and page 12 of a four-row search does
 * not exist at all. The endpoint clamps an out-of-range page to the last one,
 * so getting it wrong degrades quietly — you land on a page you did not ask for
 * and the table looks like it jumped on its own.
 *
 * The two tables using this disagree about one thing only: what a second press
 * on a column header means. That comes in as `toggle`.
 */
export function useRankedTable<T extends string>({ defaultOrdering, toggle, initialPageSize = RANKED_PAGE_SIZES[0] }: {
  defaultOrdering: T;
  toggle: (current: T, column: string) => T;
  initialPageSize?: number;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState<number>(initialPageSize);
  const [ordering, setOrdering] = useState<T>(defaultOrdering);
  const [search, setSearchState] = useState('');

  const setPageSize = useCallback((next: number) => {
    setPageSizeState(next);
    setPage(1);
  }, []);

  const sortBy = useCallback((column: string) => {
    setOrdering(current => toggle(current, column));
    setPage(1);
    // `toggle` is a module-level function at every call site, so this is stable
    // in practice; depending on it keeps that honest rather than assumed.
  }, [toggle]);

  const setSearch = useCallback((next: string) => {
    setSearchState(next);
    setPage(1);
  }, []);

  return {
    page,
    pageSize,
    ordering,
    search,
    setPage,
    setPageSize,
    sortBy,
    setSearch,
    /**
     * Fetch identity for `use-report`, which refetches when this changes and
     * has no other way to know. Every value the request is built from has to
     * appear here: omit one and the control that changes it goes dead.
     */
    requestKey: `${pageSize}:${search}:${page}:${ordering}`,
  };
}
