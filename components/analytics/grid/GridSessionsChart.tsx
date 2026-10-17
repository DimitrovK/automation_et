'use client';

import type { GridGroupBy, GridSplit } from '@/hooks/use-report-filters';
import type { Granularity, GridSessionsResponse, GridTiles } from '@/types/reports';
import { useTheme } from 'next-themes';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '@/components/reports/charts/ChartTooltip';
import { ChartLegend } from '@/components/reports/primitives/ChartLegend';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { PanelCard, Segmented } from '@/components/reports/primitives/PanelCard';
import { StatTile } from '@/components/reports/primitives/StatTile';
import { chartTheme } from '@/lib/chart-theme';

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

const GRANULARITY_OPTIONS: readonly { value: Granularity; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

/** The palette has five hues and never cycles: past four series the rest fold into "Other". */
const MAX_SERIES = 4;
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

function formatDate(iso: string, granularity: Granularity): string {
  const date = new Date(`${iso}T00:00:00`);
  return granularity === 'month'
    ? date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' })
    : date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function change(current: number, previous: number, unit: 'count' | 'points') {
  if (unit === 'points') {
    const diff = Math.round((current - previous) * 10) / 10;
    if (diff === 0) {
      return null;
    }
    return { text: `${diff > 0 ? '+' : ''}${diff} pts vs previous`, up: diff > 0 };
  }
  if (previous === 0) {
    return current === 0 ? null : { text: 'new in this window', up: true };
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  return pct === 0 ? null : { text: `${pct > 0 ? '+' : ''}${pct}% vs previous`, up: pct > 0 };
}

function Delta({ current, previous, unit = 'count' }: { current: number; previous: number; unit?: 'count' | 'points' }) {
  const result = change(current, previous, unit);
  if (!result) {
    return <p className="text-xs text-muted-foreground">same as previous period</p>;
  }
  return (
    <p className={result.up ? 'text-xs font-medium text-emerald-600 dark:text-emerald-500' : 'text-xs font-medium text-rose-600 dark:text-rose-500'}>
      {result.text}
    </p>
  );
}

/** The four numbers at the top of the page, each against the window before. */
export function GridHealthTiles({ tiles, previous }: { tiles: GridTiles; previous: GridTiles }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile
        label="Sessions"
        value={tiles.sessions.toLocaleString()}
        delta={<Delta current={tiles.sessions} previous={previous.sessions} />}
      />
      <StatTile
        label="Players"
        value={tiles.players.toLocaleString()}
        delta={<Delta current={tiles.players} previous={previous.players} />}
        hint="Signed-in people; guests share one account and are not counted"
      />
      <StatTile
        label="Completion"
        value={`${tiles.completion_pct}%`}
        delta={<Delta current={tiles.completion_pct} previous={previous.completion_pct} unit="points" />}
        hint="Finished as a share of started"
      />
      <StatTile
        label="Multiplayer share"
        value={`${tiles.multiplayer_pct}%`}
        delta={<Delta current={tiles.multiplayer_pct} previous={previous.multiplayer_pct} unit="points" />}
        hint="Room sessions as a share of all"
      />
    </div>
  );
}

/**
 * Grid sessions over time, split one way at a time.
 *
 * One chart with a switch rather than five charts: the questions are "is Grid
 * growing" and "which way of playing is", and five charts stacked would make
 * the reader do the comparison across them. Overlaid, not stacked, as on the
 * football-data chart: each area is its own count, and the question is which
 * one moved.
 */
export function GridSessionsChart({ data, split, onSplitChange, granularity, onGranularityChange }: {
  data: GridSessionsResponse;
  split: GridSplit;
  onSplitChange: (split: GridSplit) => void;
  granularity: Granularity;
  onGranularityChange: (granularity: Granularity) => void;
}) {
  const { resolvedTheme } = useTheme();
  const theme = chartTheme(resolvedTheme === 'dark');
  const { series, points } = foldSeries(data);
  const empty = data.tiles.sessions === 0;
  const top = series[0];

  return (
    <PanelCard
      id="grid-sessions"
      collapsible={false}
      title="Grid sessions over time"
      summary={top && !empty ? `${data.tiles.sessions.toLocaleString()} in the window · most: ${top.label}` : undefined}
      description="Every started Grid session, solo and room games alike unless the filters above narrow them. Pick how to split it."
      actions={(
        <>
          <Segmented label="Split by" value={split} options={SPLIT_OPTIONS} onChange={onSplitChange} />
          <Segmented label="Bucket size" value={granularity} options={GRANULARITY_OPTIONS} onChange={onGranularityChange} />
        </>
      )}
      contentClassName="flex h-80 flex-col gap-3 sm:h-96"
    >
      {empty
        ? <EmptyState hint="Try a wider date range or fewer filters.">No Grid session in this window.</EmptyState>
        : (
            <>
              <ResponsiveContainer width="100%" height="100%" className="min-h-0 flex-1">
                <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 8, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.grid.stroke} />
                  <XAxis
                    dataKey="date"
                    tick={theme.tick}
                    interval="preserveStartEnd"
                    minTickGap={24}
                    tickFormatter={(iso: string) => formatDate(iso, data.granularity)}
                  />
                  <YAxis tick={theme.tick} allowDecimals={false} width={44} />
                  <Tooltip
                    content={<ChartTooltip />}
                    cursor={theme.tooltip.cursor}
                    labelFormatter={label => formatDate(String(label), data.granularity)}
                  />
                  {series.map((s, index) => (
                    <Area
                      key={s.key}
                      type="monotone"
                      dataKey={s.key}
                      name={s.label}
                      stroke={theme.series[index]}
                      fill={theme.series[index]}
                      fillOpacity={0.2}
                      isAnimationActive={false}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
              <ChartLegend
                series={series.map((s, index) => ({
                  label: `${s.label} · ${s.sessions.toLocaleString()}`,
                  colour: theme.series[index]!,
                }))}
              />
            </>
          )}
    </PanelCard>
  );
}
