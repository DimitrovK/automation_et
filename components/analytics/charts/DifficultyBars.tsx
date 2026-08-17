'use client';

import { useTheme } from 'next-themes';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '@/components/reports/charts/ChartTooltip';
import { ChartLegend } from '@/components/reports/primitives/ChartLegend';
import { chartTheme } from '@/lib/chart-theme';
import { difficultyTier } from '@/lib/data-colours';

/**
 * Four bars per bucket, one per difficulty.
 *
 * Replaces a hand-rolled segmented bar. That version stacked the four tiers into
 * one rail, which showed composition but never said which segment was which —
 * there was no legend, no hover, and nothing to read a 3px sliver against. It
 * was the only chart on the surface you could not interrogate.
 *
 * GROUPED rather than stacked, deliberately. Stacked answers "how does this
 * decade divide"; grouped answers "how does Hard compare across decades", which
 * is the question someone opens this with — and it puts every bar on the same
 * baseline so the comparison is a length, not an offset.
 *
 * Colours come from the shared vocabulary at full saturation, unlike the matrix
 * tiles: a bar is a thin mark that has to be identified by colour alone at a
 * glance, where a tile has its number printed inside it.
 */
export function DifficultyBars({ rows, order, bucketLabel, height = 'h-72' }: {
  rows: { label: string; by_difficulty: number[] }[];
  order: string[];
  /** What one row IS — "Decade", "Game". Used in the tooltip. */
  bucketLabel: string;
  height?: string;
}) {
  const { resolvedTheme } = useTheme();
  const theme = chartTheme(resolvedTheme === 'dark');

  // Recharts needs one object per bucket with a key per series.
  const data = rows.map(row => ({
    label: row.label,
    ...Object.fromEntries(order.map((tier, index) => [tier, row.by_difficulty[index] ?? 0])),
  }));

  return (
    <div className={`flex flex-col gap-3 ${height}`}>
      <ResponsiveContainer width="100%" height="100%" className="min-h-0 flex-1">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: -12 }} barGap={1}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid.stroke} vertical={false} />
          <XAxis dataKey="label" tick={theme.tick} interval={0} angle={rows.length > 6 ? -35 : 0} textAnchor={rows.length > 6 ? 'end' : 'middle'} height={rows.length > 6 ? 52 : 30} />
          <YAxis tick={theme.tick} allowDecimals={false} width={48} />
          <Tooltip content={<ChartTooltip />} cursor={theme.tooltip.cursor} />
          {order.map(tier => (
            <Bar
              key={tier}
              dataKey={tier}
              name={difficultyTier(tier).label}
              fill={difficultyTier(tier).hex}
              radius={[3, 3, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      {/* Always present: four series cannot be identified without it, which was
          the whole complaint about the version this replaces. */}
      <ChartLegend
        series={order.map(tier => ({ label: difficultyTier(tier).label, colour: difficultyTier(tier).hex }))}
        className="justify-center"
      />
      <span className="sr-only">
        {`${bucketLabel} breakdown: ${rows.map(row => `${row.label} — ${order.map((tier, index) => `${difficultyTier(tier).label} ${row.by_difficulty[index] ?? 0}`).join(', ')}`).join('; ')}`}
      </span>
    </div>
  );
}
