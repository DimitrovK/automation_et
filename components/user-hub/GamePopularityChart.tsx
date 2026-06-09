'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toChartData } from '@/lib/user-hub-format';

type Props = {
  /** game-id slug → favourite count. */
  gamePopularity: Record<string, number>;
  /** When set, bars become clickable and call this with the game slug. */
  onGameSelect?: (slug: string) => void;
};

const BAR_COLORS = [
  '#10b981',
  '#3b82f6',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#6366f1',
  '#84cc16',
];

/**
 * Theme-aware tooltip (the default recharts tooltip is light-only, so its
 *  text is unreadable in dark mode). Uses shadcn popover tokens.
 */
function PopularityTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: { label?: string; count?: number } }[];
}) {
  const row = payload?.[0]?.payload;
  if (!active || !row) {
    return null;
  }
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
      <p className="font-medium">{row.label}</p>
      <p className="text-muted-foreground">
        {row.count}
        {' '}
        {row.count === 1 ? 'user' : 'users'}
      </p>
    </div>
  );
}

/**
 * Horizontal bar chart of how many users favourited each game. When
 *  `onGameSelect` is provided, clicking a bar drills into that game.
 */
export function GamePopularityChart({ gamePopularity, onGameSelect }: Props) {
  const data = useMemo(() => toChartData(gamePopularity), [gamePopularity]);
  const interactive = !!onGameSelect;

  // Recharts passes the bar's data entry (our row, with `slug`) as the first arg.
  const handleBarClick = (entry: unknown) => {
    const slug = (entry as { slug?: string })?.slug;
    if (slug) {
      onGameSelect?.(slug);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Game popularity</CardTitle>
        {interactive && (
          <p className="text-xs text-muted-foreground">Click a game to see who favourited it.</p>
        )}
      </CardHeader>
      <CardContent>
        {data.length === 0
          ? (
              <p className="py-8 text-center text-sm text-gray-500">
                No favourites recorded yet.
              </p>
            )
          : (
              <div style={{ height: Math.max(160, data.length * 40) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="label" width={140} tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{ fill: 'rgba(16,185,129,0.08)' }} content={<PopularityTooltip />} />
                    <Bar
                      dataKey="count"
                      name="Users"
                      radius={[0, 4, 4, 0]}
                      onClick={interactive ? handleBarClick : undefined}
                      className={interactive ? 'cursor-pointer' : undefined}
                    >
                      {data.map((row, i) => (
                        <Cell key={row.slug} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
      </CardContent>
    </Card>
  );
}
