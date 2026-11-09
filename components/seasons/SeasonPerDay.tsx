'use client';

import type { SeasonReport } from '@/types/reports';
import { useTheme } from 'next-themes';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '@/components/reports/charts/ChartTooltip';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { chartTheme } from '@/lib/chart-theme';

/** Counted games per Sofia day, from the season's start to today. */
export function SeasonPerDay({ rows }: { rows: SeasonReport['per_day'] }) {
  const { resolvedTheme } = useTheme();
  const theme = chartTheme(resolvedTheme === 'dark');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Counted games per day</CardTitle>
        <CardDescription>
          Games that counted for the season: finished by a signed-in player while it ran. Guests, bots and break-week games never count.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-64">
        {rows.length === 0
          ? <EmptyState hint="It fills in once the season starts.">No counted games yet.</EmptyState>
          : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 8, left: -12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.grid.stroke} vertical={false} />
                  <XAxis dataKey="day" tick={theme.tick} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis tick={theme.tick} allowDecimals={false} width={44} />
                  <Tooltip content={<ChartTooltip />} cursor={theme.tooltip.cursor} />
                  <Bar dataKey="counted" name="Counted games" fill={theme.series[0]} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
      </CardContent>
    </Card>
  );
}
