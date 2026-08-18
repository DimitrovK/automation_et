import type { NationOrdering } from '@/types/reports';
import { useRankedTable } from '@/hooks/use-ranked-table';

/** Which column header was pressed, as opposed to what to ask the API for. */
export type NationSortColumn = 'footballers' | 'name';

/**
 * The ordering a click on a nations column header should produce.
 *
 * Footballers toggles between its two directions. Name has only one — the
 * endpoint declares `name` and no reverse, and a toggle where every second
 * press does nothing is worse than a control that plainly sorts one way.
 */
export function nextNationOrdering(current: NationOrdering, column: string): NationOrdering {
  if (column === 'name') {
    return 'name';
  }
  return current === 'footballers' ? 'footballers_asc' : 'footballers';
}

/** Page, size, sort and search for the deepest-nations table. */
export function useNationTable() {
  return useRankedTable<NationOrdering>({
    defaultOrdering: 'footballers',
    toggle: nextNationOrdering,
  });
}
