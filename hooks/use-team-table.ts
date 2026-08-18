import type { TeamOrdering } from '@/types/reports';
import { useRankedTable } from '@/hooks/use-ranked-table';

/** Which column header was pressed, as opposed to what to ask the API for. */
export type TeamSortColumn = 'players' | 'name';

/**
 * The ordering a click on a teams column header should produce.
 *
 * Players toggles between its two directions. Name has only one — the endpoint
 * declares `name` and no reverse, and a toggle where every second press does
 * nothing is worse than a control that plainly sorts one way.
 */
export function nextOrdering(current: TeamOrdering, column: string): TeamOrdering {
  if (column === 'name') {
    return 'name';
  }
  return current === 'players' ? 'players_asc' : 'players';
}

/** Page, size, sort and search for the squad-depth table. */
export function useTeamTable() {
  return useRankedTable<TeamOrdering>({
    defaultOrdering: 'players',
    toggle: nextOrdering,
  });
}
