'use client';

import type { ActivityDay, MetricKey } from '@/types/reports';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { METRIC_OPTIONS } from '@/types/reports';
import { useTheme } from 'next-themes';
import { chartTheme } from '@/lib/chart-theme';

/** Day-month tick, in UTC so it renders as the intended day regardless of viewer TZ. */
function formatDay(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(d);
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
  // An uncovered day was never computed. Feeding 0 to the chart draws a
  // confident dip that never happened, so the value becomes null and recharts
  // leaves a visible break instead.
  const data = series.map(row => ({
    ...row,
    label: formatDay(row.date),
    ...(row.covered
      ? {}
      : {
          games_started: null,
          games_finished: null,
          distinct_players: null,
          mp_player_sessions: null,
        }),
  }));
  const uncovered = series.filter(row => !row.covered).length;
  const primaryColor = color ?? DEFAULT_COLORS[metric];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {description}
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
