'use client';

import { useTheme } from 'next-themes';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { chartTheme } from '@/lib/chart-theme';

/**
 * One ranked series, one bar per thing, identity colours — the "what do
 * people actually like" chart.
 *
 * Deliberately NOT a table restated: the tables around it answer "how does
 * this one perform", this answers "which of these is big", which is a
 * length comparison and nothing else. Values ride in the tooltip with the
 * share of the whole, because a bar without its share invites the reader
 * to eyeball percentages off pixel heights.
 */

export type PopularityRow = {
  key: string;
  label: string;
  value: number;
  colour: string;
};

function ShareTooltip({ active, payload, total }: {
  active?: boolean;
  payload?: { payload?: PopularityRow }[];
  total: number;
}) {
  const row = payload?.[0]?.payload;
  if (!active || !row) {
    return null;
  }
  const pct = total > 0 ? Math.round((row.value / total) * 1000) / 10 : null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-foreground">{row.label}</p>
      <p className="flex items-center gap-1.5 text-muted-foreground">
        <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: row.colour }} />
        <span className="font-medium text-foreground tabular-nums">{row.value.toLocaleString()}</span>
        {pct !== null && <span className="tabular-nums">{`(${pct}% of the total)`}</span>}
      </p>
    </div>
  );
}

export function PopularityBars({ rows, ariaLabel, height = 'h-64' }: {
  rows: PopularityRow[];
  /** What is being compared — read by screen readers with every value. */
  ariaLabel: string;
  height?: string;
}) {
  const { resolvedTheme } = useTheme();
  const theme = chartTheme(resolvedTheme === 'dark');
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  const angled = rows.length > 5;

  return (
    <div className={`flex flex-col ${height}`}>
      <ResponsiveContainer width="100%" height="100%" className="min-h-0 flex-1">
        <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 8, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid.stroke} vertical={false} />
          <XAxis
            dataKey="label"
            tick={theme.tick}
            interval={0}
            angle={angled ? -35 : 0}
            textAnchor={angled ? 'end' : 'middle'}
            height={angled ? 64 : 30}
          />
          <YAxis tick={theme.tick} allowDecimals={false} width={48} />
          <Tooltip content={<ShareTooltip total={total} />} cursor={theme.tooltip.cursor} />
          <Bar dataKey="value" radius={[3, 3, 0, 0]}>
            {rows.map(row => (
              <Cell key={row.key} fill={row.colour} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <span className="sr-only">
        {`${ariaLabel}: ${rows.map((row) => {
          const pct = total > 0 ? Math.round((row.value / total) * 1000) / 10 : 0;
          return `${row.label} ${row.value} (${pct}%)`;
        }).join(', ')}`}
      </span>
    </div>
  );
}
