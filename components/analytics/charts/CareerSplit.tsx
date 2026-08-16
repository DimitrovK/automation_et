'use client';

import { useTheme } from 'next-themes';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '@/components/reports/charts/ChartTooltip';
import { ChartLegend } from '@/components/reports/primitives/ChartLegend';
import { chartTheme } from '@/lib/chart-theme';

/**
 * Retired against still playing, per difficulty tier.
 *
 * Stacked, unlike the growth chart: here the two bands ARE a whole — every
 * approved footballer is one or the other — so the bar height is the tier size
 * and the split within it is the answer. That is the composition question a
 * stack is actually for.
 */
export function CareerSplit({ tiers }: {
  tiers: { difficulty: string; retired: number; active: number }[];
}) {
  const { resolvedTheme } = useTheme();
  const theme = chartTheme(resolvedTheme === 'dark');

  const rows = tiers.map(tier => ({
    label: `${tier.difficulty[0]}${tier.difficulty.slice(1).toLowerCase()}`,
    active: tier.active,
    retired: tier.retired,
  }));

  return (
    <div className="flex h-64 flex-col gap-3">
      <ResponsiveContainer width="100%" height="100%" className="min-h-0 flex-1">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 8, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid.stroke} />
          <XAxis dataKey="label" tick={theme.tick} />
          <YAxis tick={theme.tick} allowDecimals={false} width={48} />
          <Tooltip content={<ChartTooltip />} cursor={theme.tooltip.cursor} />
          <Bar dataKey="active" name="Still playing" stackId="career" fill={theme.series[0]} radius={[0, 0, 4, 4]} />
          <Bar dataKey="retired" name="Retired" stackId="career" fill={theme.series[1]} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <ChartLegend
        series={[
          { label: 'Still playing', colour: theme.series[0] },
          { label: 'Retired', colour: theme.series[1] },
        ]}
      />
    </div>
  );
}
