'use client';

import { useTheme } from 'next-themes';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '@/components/reports/charts/ChartTooltip';
import { ChartLegend } from '@/components/reports/primitives/ChartLegend';
import { chartTheme } from '@/lib/chart-theme';
import { CAREER_STATE } from '@/lib/data-colours';

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
          {/* The same hexes the bars above use — a chart and a bar describing
              the same thing in different colours is worse than either alone. */}
          <Bar dataKey="active" name={CAREER_STATE.active.label} stackId="career" fill={CAREER_STATE.active.hex} radius={[0, 0, 4, 4]} />
          <Bar dataKey="retired" name={CAREER_STATE.retired.label} stackId="career" fill={CAREER_STATE.retired.hex} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <ChartLegend
        series={[
          { label: CAREER_STATE.active.label, colour: CAREER_STATE.active.hex },
          { label: CAREER_STATE.retired.label, colour: CAREER_STATE.retired.hex },
        ]}
      />
    </div>
  );
}
