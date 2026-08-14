'use client';

import type { ChartTheme } from '@/lib/chart-theme';
import type { ActivityDay, Granularity, MetricKey } from '@/types/reports';
import { useTheme } from 'next-themes';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '@/components/reports/ChartTooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { chartTheme } from '@/lib/chart-theme';
import { metricPanels } from '@/lib/metric-panels';
import { cn } from '@/lib/utils';
import { GRANULARITIES, METRIC_OPTIONS } from '@/types/reports';

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

/**
 * A metric's total over the window, skipping uncovered days rather than
 *  counting them as zero — the same rule the chart draws by.
 */
function total(rows: { [key: string]: unknown }[], key: MetricKey): number {
  return rows.reduce((sum, row) => sum + (typeof row[key] === 'number' ? (row[key] as number) : 0), 0);
}

/**
 * Metric -> slot in the shared categorical series.
 *
 * A metric keeps its slot regardless of which one is selected, so "blue" means
 * finished-sessions on the large chart and on the three small ones beneath it.
 * Assigning by position in the rendered list would repaint every metric as soon
 * as the selection changed.
 */
const METRIC_SLOT: Record<MetricKey, number> = {
  games_started: 0,
  games_finished: 1,
  distinct_players: 2,
  mp_player_sessions: 3,
};

function metricColor(theme: ChartTheme, metric: MetricKey): string {
  return theme.series[METRIC_SLOT[metric]];
}

/**
 * Daily activity: the selected metric large, the other three beneath it.
 *
 * All four used to share one y-axis, with the unselected ones drawn faint. That
 * was two problems wearing one coat. A shared axis across metrics of different
 * magnitudes flattens the small ones into a line along the bottom — distinct
 * players runs in the tens where games played runs in the thousands, so the
 * shape of the most interesting series was never visible. And a shared axis
 * asserts* comparability: it invites reading the gap between two lines as if
 * it meant something, when one counts sessions and the other counts people.
 *
 * Small multiples instead. Each panel keeps its own scale, they share the
 * x-axis, and nobody is invited to subtract one from another. The two-axis
 * alternative is the one thing worse than both — it lets the author choose
 * where the lines cross.
 */
export function ActivityChart({ series, title, description, metric, color, granularity, onGranularityChange }: {
  series: ActivityDay[];
  title: string;
  description: string;
  metric: MetricKey;
  /** Overrides the metric colour — used to match the selected game's badge. */
  color?: string;
  /**
   * Controlled, because the bucketing happens server-side: a week's distinct
   * players must be computed, not summed, so changing this refetches rather
   * than regrouping what is already on screen.
   */
  granularity: Granularity;
  onGranularityChange: (next: Granularity) => void;
}) {
  const { resolvedTheme } = useTheme();
  const theme = chartTheme(resolvedTheme === 'dark');
  // The control lives in this header — it changes how this chart reads and
  // nothing else on the page — but the state lives with the request, because
  // the server does the bucketing.
  const rows = series;
  const effective = granularity;
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
  const primaryColor = color ?? metricColor(theme, metric);
  const panels = metricPanels(metric);
  const primaryOption = METRIC_OPTIONS.find(option => option.key === panels.primary)!;

  return (
    <Card>
      <CardHeader className="space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle>{title}</CardTitle>
          <div className="flex gap-1 rounded-md border p-0.5">
            {GRANULARITIES.map(option => (
              <button
                key={option}
                type="button"
                aria-pressed={effective === option}
                title={`Group by ${option}`}
                onClick={() => onGranularityChange(option)}
                className={cn(
                  'rounded px-2 py-0.5 text-xs font-medium capitalize transition-colors',
                  effective === option
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
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
            <Tooltip content={<ChartTooltip />} cursor={theme.tooltip.cursor} />
            {/* One line, its own axis. The others are below at their own
                scales rather than squashed onto this one. */}
            <Line
              type="monotone"
              dataKey={primaryOption.key}
              name={primaryOption.label}
              stroke={primaryColor}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>

      {/* The other three, each on its own scale. Same x-axis, no shared y —
          so the shapes can be compared without the numbers being implied to
          be comparable. */}
      <CardContent className="grid grid-cols-1 gap-4 pt-0 sm:grid-cols-3">
        {panels.context.map(key => METRIC_OPTIONS.find(option => option.key === key)!).map(option => (
          <div key={option.key} className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              {option.label}
              <span className="ml-1 font-normal tabular-nums text-muted-foreground/70">
                {total(data, option.key).toLocaleString()}
              </span>
            </p>
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <XAxis dataKey="label" hide />
                  {/* Its own domain, which is the entire point: on the shared
                      axis above, a series in the tens beside one in the
                      thousands was a flat line along the bottom. */}
                  <YAxis hide domain={['dataMin', 'dataMax']} />
                  <Tooltip content={<ChartTooltip />} cursor={theme.tooltip.cursor} />
                  <Line
                    type="monotone"
                    dataKey={option.key}
                    name={option.label}
                    stroke={metricColor(theme, option.key)}
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
