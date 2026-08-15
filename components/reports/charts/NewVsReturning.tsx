'use client';

import type { NewReturningRow } from '@/types/reports';
import { useTheme } from 'next-themes';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '@/components/reports/charts/ChartTooltip';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { chartTheme } from '@/lib/chart-theme';

/**
 * Whether the platform is growing or just circulating the same people.
 *
 * Lifted out of the Patterns page when that was removed. The rest of that page —
 * play by hour and by weekday — is noise at ~480 sessions a day: the curve moves
 * with a handful of people and has never changed a decision. This panel is the
 * one thing on it that could, so it moves to the overview rather than going with
 * the page.
 *
 * Stacked on purpose. The question is the composition of a day, not two
 * independent lines: all-returning means growth has stalled, all-new means
 * nobody is staying, and a reader should be able to see which without doing
 * arithmetic.
 */
export function NewVsReturning({ rows }: { rows: NewReturningRow[] }) {
  const { resolvedTheme } = useTheme();
  const theme = chartTheme(resolvedTheme === 'dark');

  return (
    <Card>
      <CardHeader>
        <CardTitle>New vs returning players</CardTitle>
        <CardDescription>
          "New" means the account was registered that day. A healthy day has both — all
          returning means growth has stalled, all new means nobody is staying.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-64 sm:h-72">
        {rows.length === 0
          ? <EmptyState hint="Try a wider date range.">No player activity in this window.</EmptyState>
          : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 8, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.grid.stroke} />
                  <XAxis dataKey="date" tick={theme.tick} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis tick={theme.tick} allowDecimals={false} width={44} />
                  <Tooltip content={<ChartTooltip />} cursor={theme.tooltip.cursor} />
                  <Area
                    type="monotone"
                    dataKey="returning_players"
                    name="Returning"
                    stackId="players"
                    stroke={theme.series[1]}
                    fill={theme.series[1]}
                    fillOpacity={0.5}
                  />
                  <Area
                    type="monotone"
                    dataKey="new_players"
                    name="New"
                    stackId="players"
                    stroke={theme.series[0]}
                    fill={theme.series[0]}
                    fillOpacity={0.8}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
      </CardContent>
    </Card>
  );
}
