import type { GridModeRow } from '@/types/reports';

/**
 * The one translation from mode wire vocabulary to reader words —
 * shared by the modes table, the popularity chart and the filter chip
 * so the same bucket never renders under two names.
 */
export function modeLabel(row: GridModeRow): string {
  const difficulty = row.difficulty === 'EASY'
    ? 'Standard'
    : row.difficulty === 'HARD'
      ? 'Hard'
      : row.difficulty ?? 'Unclassified';
  const roster = row.footballer_status === 'ACTIVE'
    ? ' · Active'
    : row.footballer_status === 'NOT_ACTIVE'
      ? ' · Retired'
      : '';
  const size = row.grid_size ? ` · ${row.grid_size}` : '';
  return `${difficulty}${roster}${size}`;
}

export function modeKey(row: GridModeRow): string {
  return `${row.difficulty}|${row.footballer_status}|${row.grid_size}`;
}
