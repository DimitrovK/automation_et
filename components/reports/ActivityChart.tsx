'use client';

import type { ActivityDay, MetricKey } from '@/types/reports';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { METRIC_OPTIONS } from '@/types/reports';
import { useTheme } from 'next-themes';
import { chartTheme } from '@/lib/chart-theme';
import type { Granularity } from '@/lib/report-granularity';
import { useState } from 'react';
import { aggregateSeries, canAggregate, GRANULARITIES } from '@/lib/report-granularity';
import { cn } from '@/lib/utils';

/** Day-month tick, in UTC so it renders as the intended day regardless of viewer TZ. */
/** Labels follow the bucket: a month bar labelled "1 Aug" reads as one day. */
function formatBucket(iso: string, granularity: Granularity): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return iso;
  }
  if (granularity === 'month') {
    return new Intl.DateTimeFormat('en-GB', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(d);
  }
  const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(d);
  return granularity === 'week' ? `w/c ${day}` : day;
}

const DEFAULT_COLORS: Record<MetricKey, string> = {
  games_started: '#059669',
  games_finished: '#2563eb',
  distinct_players: '#f59e0b',
  mp_player_sessions: '#8b5cf6',
};

/**
 * Daily activity. The selected metric is drawn boldly and the others stay as
 * faint context — showing only the selection loses the shape that makes it
 * meaningful (a "played" line means much more next to "finished"), while giving
 * four lines equal weight makes none of them readable.
 */
export function ActivityChart({ series, title, description, metric, color }: {
  series: ActivityDay[];
  title: string;
  description: string;
  metric: MetricKey;
  /** Overrides the metric colour — used to match the selected game's badge. */
  color?: string;
}) {
  const { resolvedTheme } = useTheme();
  const theme = chartTheme(resolvedTheme === 'dark');
  // Chart-owned, not page-owned: it changes how this chart reads and nothing
  // else on the page, so it belongs in this header rather than the filter bar.
  const [granularity, setGranularity] = useState<Granularity>('day');
  const aggregatable = canAggregate(metric);
  // Distinct players cannot be summed across days, so the control falls back to
  // daily rather than drawing an inflated line. Silently ignoring the choice
  // would be worse: the button would look selected and the data wouldn't match.
  const effective: Granularity = aggregatable ? granularity : 'day';
  const rows = aggregateSeries(series, effective);
  // An uncovered day was never computed. Feeding 0 to the chart draws a
  // confident dip that never happened, so the value becomes null and recharts
  // leaves a visible break instead.
  const data = rows.map(row => ({
    ...row,
    label: formatBucket(row.date, effective),
    ...(row.covered
      ? {}
      : {
          games_started: null,
          games_finished: null,
          distinct_players: null,
          mp_player_sessions: null,
        }),
  }));
  const uncovered = rows.filter(row => !row.covered).length;
  const primaryColor = color ?? DEFAULT_COLORS[metric];

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle>{title}</CardTitle>
          <div className="flex gap-1 rounded-md border p-0.5 dark:border-slate-700">
            {GRANULARITIES.map(option => (
              <button
                key={option}
                type="button"
                disabled={!aggregatable && option !== 'day'}
                aria-pressed={effective === option}
                title={aggregatable
                  ? `Group by ${option}`
                  : 'Distinct players cannot be added up across days, so this metric is only shown daily'}
                onClick={() => setGranularity(option)}
                className={cn(
                  'rounded px-2 py-0.5 text-xs font-medium capitalize transition-colors',
                  effective === option
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'text-gray-500 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-700/50',
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        <CardDescription>
          {description}
          {!aggregatable && (
            <>
              {' '}
              <span className="text-gray-500 dark:text-gray-400">
                Shown daily: distinct players can't be added up across days, so a
                weekly total would count the same person more than once.
              </span>
            </>
          )}
          {uncovered > 0 && (
            <>
              {' '}
              <span className="text-amber-700 dark:text-amber-300">
                {uncovered}
                {' day'}
                {uncovered === 1 ? '' : 's'}
                {' in this range were never computed and are drawn as gaps, not zeroes.'}
              </span>
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -12 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.grid.stroke} />
            <XAxis dataKey="label" tick={theme.tick} interval="preserveStartEnd" minTickGap={24} />
            <YAxis tick={theme.tick} allowDecimals={false} width={44} />
            <Tooltip contentStyle={theme.tooltip.contentStyle}
                          labelStyle={theme.tooltip.labelStyle}
                          itemStyle={theme.tooltip.itemStyle} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {METRIC_OPTIONS.map((option) => {
              const isPrimary = option.key === metric;
              return (
                <Line
                  key={option.key}
                  type="monotone"
                  dataKey={option.key}
                  name={option.label}
                  stroke={isPrimary ? primaryColor : DEFAULT_COLORS[option.key]}
                  strokeWidth={isPrimary ? 2.5 : 1}
                  strokeOpacity={isPrimary ? 1 : 0.28}
                  dot={false}
                  activeDot={isPrimary ? { r: 4 } : false}
                  connectNulls={false}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
