'use client';

import type { GrowthResponse } from '@/types/reports';
import { useTheme } from 'next-themes';
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '@/components/reports/charts/ChartTooltip';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { MetricRow } from '@/components/reports/primitives/MetricRow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { chartTheme } from '@/lib/chart-theme';
import { toChartRow } from '@/lib/growth-flow';

/**
 * Where each week's players came from, and where last week's went.
 *
 * The totals view says "sessions were up 12%", which cannot be acted on — 500
 * sessions is 50 loyal players or 200 tourists. Four bands say which.
 *
 * Stacked with churn BELOW the axis, because that is what makes the shape
 * readable at a glance: the bar above the line is what the week gained and kept,
 * the bar below is what it lost, and a week where the two are level is a week
 * that stood still however good the total looked.
 *
 * The quick ratio deliberately does NOT go on this chart. It is a ratio around
 * 1 against player counts in the hundreds, so it needs its own scale — and a
 * second y-axis is the one chart decision that reliably misleads. It sits above
 * as a figure instead.
 */

const BAND_NAMES = {
  retained: 'Stayed',
  resurrected: 'Came back',
  new: 'New',
  churned: 'Churned',
} as const;

export function GrowthFlow({ data }: { data: GrowthResponse }) {
  const { resolvedTheme } = useTheme();
  const theme = chartTheme(resolvedTheme === 'dark');
  const rows = data.rows.map(toChartRow);
  const provisional = data.rows.find(row => row.provisional);

  // Semantic, not the categorical order: green is what arrived, rose is what
  // left, and the two calm hues in between are the players who were already
  // here. Reading gain and loss off hue is the whole point of the shape.
  const colours = {
    retained: theme.series[1],
    resurrected: theme.series[2],
    new: theme.series[0],
    churned: theme.series[4],
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Where the week's players came from</CardTitle>
        <CardDescription>
          Above the line is what the week gained and kept; below it is what it lost.
          A week where the two are level stood still, however good the total looked.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Named, because the totals above do NOT cover the whole selection —
            the running week is left out of them, and a reader comparing this
            figure with the date picker would otherwise find it short. */}
        <MetricRow
          columns={4}
          metrics={[
            { label: 'New players', value: data.summary.new.toLocaleString(), metric: 'new_players_weekly' },
            { label: 'Came back', value: data.summary.resurrected.toLocaleString(), metric: 'resurrected_players' },
            { label: 'Churned', value: data.summary.churned.toLocaleString(), metric: 'churned_players' },
            {
              label: 'Quick ratio',
              // Gained over lost. Above 1 the period added more than it lost.
              value: data.summary.quick_ratio === null ? '—' : String(data.summary.quick_ratio),
              metric: 'quick_ratio',
            },
          ]}
        />
        <p className="text-xs text-muted-foreground">
          {`Totals cover ${data.weeks_covered} settled ${data.weeks_covered === 1 ? 'week' : 'weeks'}.`}
        </p>

        <div className="h-64 sm:h-72">
          {rows.length === 0
            ? <EmptyState hint="Try a wider date range.">No player activity in this window.</EmptyState>
            : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 8, left: -12 }} stackOffset="sign">
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.grid.stroke} />
                    <XAxis dataKey="week" tick={theme.tick} interval="preserveStartEnd" minTickGap={16} />
                    <YAxis tick={theme.tick} allowDecimals={false} width={44} />
                    <Tooltip content={<ChartTooltip />} cursor={theme.tooltip.cursor} />
                    {/* The line the shape is read against. Without it, a week
                        that lost more than it gained still looks like a bar. */}
                    <ReferenceLine y={0} stroke={theme.axisLine.stroke} />
                    {(['retained', 'resurrected', 'new', 'churned'] as const).map(band => (
                      <Bar key={band} dataKey={band} name={BAND_NAMES[band]} stackId="players" fill={colours[band]}>
                        {rows.map(row => (
                          // The provisional week is drawn faint rather than
                          // dropped: its churn cannot be known yet, and hiding
                          // the most recent bar on a report about what is
                          // happening now is worse than marking it.
                          <Cell key={row.week} fillOpacity={row.provisional ? 0.35 : 0.9} />
                        ))}
                      </Bar>
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}
        </div>

        {provisional && (
          <p className="text-xs text-muted-foreground">
            {`Week of ${provisional.week} is still running — its churn cannot be counted until the following week ends, so the faint bar understates what it will keep.`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
