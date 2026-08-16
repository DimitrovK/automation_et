'use client';

import type { CoverageResponse } from '@/types/reports';
import { useTheme } from 'next-themes';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '@/components/reports/charts/ChartTooltip';
import { ChartLegend } from '@/components/reports/primitives/ChartLegend';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { StatTile } from '@/components/reports/primitives/StatTile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { chartTheme } from '@/lib/chart-theme';

/**
 * How much football data exists, and how much of it arrived in the window.
 *
 * The rest of this page measures completeness — what the games are missing. It
 * cannot say whether anyone is still filling the gaps, and a gap that is
 * shrinking weekly reads exactly like one that has been static since April.
 * Those call for opposite responses.
 *
 * Footballers and teams share ONE chart because they share a unit and a scale:
 * both are rows added per day, peaking at 69 and 46. Two y-axes on one chart is
 * the single chart decision that reliably misleads, and two charts side by side
 * would lose the comparison that makes the pair worth showing together.
 *
 * Nations get a figure and a date instead of a series. Four were added in the
 * last ninety days; a time series of four events is four dots on an empty
 * canvas, and the date answers the same question in less space.
 */
export function CatalogueGrowth({ data }: { data: CoverageResponse }) {
  const { resolvedTheme } = useTheme();
  const theme = chartTheme(resolvedTheme === 'dark');
  const { totals, added_series: series } = data;

  // The BE may not carry these yet — the repositories deploy independently.
  if (!totals || !series) {
    return null;
  }

  const lastAdded = totals.nations_last_added
    ? new Date(totals.nations_last_added).toLocaleDateString(undefined, { dateStyle: 'medium' })
    : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Footballers added"
          value={totals.footballers_added.toLocaleString()}
          hint={`${totals.teams_added.toLocaleString()} teams in the same window`}
        />
        <StatTile
          label="Approved footballers"
          value={totals.footballers_approved.toLocaleString()}
        />
        <StatTile
          label="Approved teams"
          value={totals.teams_approved.toLocaleString()}
        />
        {/* "Active", not "approved". `Nation` has no approval step at all — the
            only gate is whether the country still exists, so naming it approved
            would name a workflow nobody runs. */}
        <StatTile
          label="Active nations"
          value={totals.nations_active.toLocaleString()}
          hint={
            totals.nations_total > totals.nations_active
              ? `${(totals.nations_total - totals.nations_active).toLocaleString()} defunct${lastAdded ? ` · last added ${lastAdded}` : ''}`
              : lastAdded
                ? `Last added ${lastAdded}`
                : undefined
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>What was added, by day</CardTitle>
          <CardDescription>
            Counts every row created in the window, approved or not — a footballer added
            now and reviewed next week was still work done now.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex h-72 flex-col gap-3 sm:h-80">
          {series.length === 0
            ? <EmptyState hint="Try a wider date range.">Nothing was added in this window.</EmptyState>
            : (
                <ResponsiveContainer width="100%" height="100%" className="min-h-0 flex-1">
                  <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 8, left: -12 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.grid.stroke} />
                    <XAxis dataKey="date" tick={theme.tick} interval="preserveStartEnd" minTickGap={24} />
                    <YAxis tick={theme.tick} allowDecimals={false} width={44} />
                    <Tooltip content={<ChartTooltip />} cursor={theme.tooltip.cursor} />
                    {/* Overlaid, not stacked. These are independent quantities;
                        stacking them would draw a combined height that means
                        nothing, and the question is which of the two moved. */}
                    <Area
                      type="monotone"
                      dataKey="footballers"
                      name="Footballers"
                      stroke={theme.series[0]}
                      fill={theme.series[0]}
                      fillOpacity={0.25}
                    />
                    <Area
                      type="monotone"
                      dataKey="teams"
                      name="Teams"
                      stroke={theme.series[1]}
                      fill={theme.series[1]}
                      fillOpacity={0.25}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}

          {series.length > 0 && (
            <ChartLegend
              series={[
                { label: 'Footballers', colour: theme.series[0] },
                { label: 'Teams', colour: theme.series[1] },
              ]}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
