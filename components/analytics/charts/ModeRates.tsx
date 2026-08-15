'use client';

import type { CareerPathAnalyticsResponse } from '@/types/reports';
import { useTheme } from 'next-themes';
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '@/components/reports/charts/ChartTooltip';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { MetricInfo } from '@/components/reports/primitives/MetricInfo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { chartTheme } from '@/lib/chart-theme';

/**
 * How each mode plays, not how much of it was built.
 *
 * Horizontal bars because the mode names are long and there are seven of them —
 * vertical ticks would be rotated or truncated, and a mode nobody can read is a
 * bar nobody can act on. Sorted by solve rate rather than volume: the question
 * is which mode is hardest, and volume is already the label on each bar.
 *
 * One measure per chart. Solve rate and help rate live on different scales
 * (70-ish% against 2-ish%) and putting both on one axis would flatten the
 * second into the baseline — which is the argument against a second axis, not
 * for one.
 */

/** Below this many appearances a rate swings on a handful of guesses. */
const MIN_APPEARANCES = 30;

export function ModeRates({ data }: { data: CareerPathAnalyticsResponse }) {
  const { resolvedTheme } = useTheme();
  const theme = chartTheme(resolvedTheme === 'dark');

  const rows = data.shape.modes
    .filter(mode => mode.appearances >= MIN_APPEARANCES && mode.solve_rate_pct !== null)
    .map(mode => ({
      mode: mode.mode.replaceAll('_', ' ').toLowerCase(),
      solve_rate_pct: mode.solve_rate_pct,
      appearances: mode.appearances,
    }))
    .sort((a, b) => (b.solve_rate_pct ?? 0) - (a.solve_rate_pct ?? 0));

  const withheld = data.shape.modes.length - rows.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          How each mode plays
          <MetricInfo metric="mode_solve_rate" />
        </CardTitle>
        <CardDescription>
          The share of appearances solved, by the mode the path was built in. Read
          it beside the difficulty grading rather than instead of it — the two are
          tuned by different people and move the same number.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="h-72">
          {rows.length === 0
            ? <EmptyState hint="Try a wider date range.">No mode has enough appearances to rate.</EmptyState>
            : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 44, bottom: 4, left: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.grid.stroke} horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={theme.tick} unit="%" />
                    <YAxis type="category" dataKey="mode" tick={theme.tick} width={104} />
                    <Tooltip content={<ChartTooltip />} cursor={theme.tooltip.cursor} />
                    <Bar dataKey="solve_rate_pct" name="Solved" fill={theme.series[1]} radius={[0, 4, 4, 0]}>
                      {/* The rate on the bar, so the chart is readable without
                          hovering — this is a seven-row comparison, not an
                          exploration. */}
                      <LabelList
                        dataKey="solve_rate_pct"
                        position="right"
                        formatter={(value: React.ReactNode) => `${value}%`}
                        className="fill-muted-foreground text-xs"
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
        </div>

        {withheld > 0 && (
          // Named rather than silently dropped: a mode missing from a chart
          // reads as a mode nobody plays, which is a different fact.
          <p className="text-xs text-muted-foreground">
            {`${withheld} ${withheld === 1 ? 'mode is' : 'modes are'} left out — under ${MIN_APPEARANCES} appearances, a rate swings on a handful of guesses.`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
