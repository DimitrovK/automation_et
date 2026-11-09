import type { GridGroupBy, GridSplit } from '@/hooks/use-report-filters';
import type { GridSessionsResponse } from '@/types/reports';

/**
 * The Grid sessions chart's options and series folding, apart from the chart so
 * its file exports only components (fast refresh; `lint:reports` runs with
 * `--max-warnings 0`).
 */
export const SPLIT_OPTIONS: readonly { value: GridSplit; label: string }[] = [
  { value: 'play_type', label: 'Solo / Multiplayer' },
  { value: 'board', label: 'Board' },
  { value: 'variation_mode', label: 'Classic / Reversed' },
  { value: 'reveal', label: 'Instant / Final Whistle' },
  { value: 'difficulty', label: 'Standard / Hard' },
];

export const GROUP_OPTIONS: readonly { value: GridGroupBy; label: string }[] = [
  { value: 'mode', label: 'Mode' },
  ...SPLIT_OPTIONS,
];

/** The palette has five hues and never cycles: past four series the rest fold into "Other". */
export const MAX_SERIES = 4;
export const OTHER_KEY = '__other';

export type ChartSeries = { key: string; label: string; sessions: number };

/** The series to draw, and the points with everything past the first four summed into "Other". */
export function foldSeries(data: GridSessionsResponse): {
  series: ChartSeries[];
  points: Record<string, number | string>[];
} {
  const keys = data.series_keys;
  if (keys.length <= MAX_SERIES + 1) {
    return { series: keys, points: data.series };
  }
  const kept = keys.slice(0, MAX_SERIES);
  const folded = keys.slice(MAX_SERIES);
  const otherSessions = folded.reduce((sum, k) => sum + k.sessions, 0);
  const points = data.series.map((point) => {
    const next: Record<string, number | string> = { date: point.date, total: point.total };
    for (const k of kept) {
      next[k.key] = point[k.key] ?? 0;
    }
    next[OTHER_KEY] = folded.reduce((sum, k) => sum + Number(point[k.key] ?? 0), 0);
    return next;
  });
  return {
    series: [...kept, { key: OTHER_KEY, label: `Other (${folded.length})`, sessions: otherSessions }],
    points,
  };
}
