import type { CareerPathOrdering } from '@/types/reports';
import { useRankedTable } from '@/hooks/use-ranked-table';

/**
 * The ordering a click on a content column header should produce.
 *
 * Only "needed help" has two directions worth offering. The rest have one
 * interesting end each — most played, most abandoned, most guesses, A to Z —
 * and a toggle whose second press does nothing is worse than a plain sort.
 */
export function nextContentOrdering(current: CareerPathOrdering, column: string): CareerPathOrdering {
  if (column === 'help') {
    return current === 'help' ? 'help_asc' : 'help';
  }
  return column as CareerPathOrdering;
}

/** Page, size, sort and search for the footballer content table. */
export function useCareerPathTable() {
  return useRankedTable<CareerPathOrdering>({
    defaultOrdering: 'help',
    toggle: nextContentOrdering,
  });
}
