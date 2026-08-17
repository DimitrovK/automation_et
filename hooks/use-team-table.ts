import type { TeamOrdering } from '@/types/reports';
import { useCallback, useState } from 'react';

/** Page sizes offered in the dropdown. 100 is the endpoint's own ceiling. */
export const TEAM_PAGE_SIZES = [10, 25, 50, 100] as const;

/** Which column header was pressed, as opposed to what to ask the API for. */
export type TeamSortColumn = 'players' | 'name';

/**
 * The ordering a click on a column header should produce.
 *
 * Players toggles between its two directions. Name has only one — the endpoint
 * declares `name` and no reverse, and a toggle where every second press does
 * nothing is worse than a control that plainly sorts one way.
 */
export function nextOrdering(current: TeamOrdering, column: TeamSortColumn): TeamOrdering {
  if (column === 'name') {
    return 'name';
  }
  return current === 'players' ? 'players_asc' : 'players';
}

/**
 * Everything the squad-depth request is made of, and the rule that keeps them
 * consistent: anything that changes WHICH rows exist resets to page one.
 *
 * That rule is the whole reason this is a hook rather than four `useState`
 * calls in the page. Page 40 of 441 is not page 40 of 45, and page 12 of a
 * four-row search does not exist at all. The endpoint clamps out-of-range pages
 * to the last one, so getting this wrong degrades quietly — you land on a page
 * you did not ask for and the table looks like it jumped on its own.
 */
export function useTeamTable(initialLimit: number = TEAM_PAGE_SIZES[0]) {
  const [page, setPage] = useState(1);
  const [limit, setLimitState] = useState(initialLimit);
  const [ordering, setOrdering] = useState<TeamOrdering>('players');
  const [search, setSearchState] = useState('');

  const setLimit = useCallback((next: number) => {
    setLimitState(next);
    setPage(1);
  }, []);

  const sortBy = useCallback((column: TeamSortColumn) => {
    setOrdering(current => nextOrdering(current, column));
    setPage(1);
  }, []);

  const setSearch = useCallback((next: string) => {
    setSearchState(next);
    setPage(1);
  }, []);

  return {
    page,
    limit,
    ordering,
    search,
    setPage,
    setLimit,
    sortBy,
    setSearch,
    /**
     * Fetch identity for `use-report`, which refetches when this changes and
     * has no other way to know. Every value the request is built from has to
     * appear here: omit one and the control that changes it goes dead.
     */
    requestKey: `${limit}:${search}:${page}:${ordering}`,
  };
}
