'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toChartData } from '@/lib/user-hub-format';

type Props = {
  /** game-id slug → favourite count. */
  gamePopularity: Record<string, number>;
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

/** Horizontal bar chart of how many users favourited each game. */
export function GamePopularityChart({ gamePopularity }: Props) {
  const data = useMemo(() => toChartData(gamePopularity), [gamePopularity]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Game popularity</CardTitle>
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
                    <Tooltip cursor={{ fill: 'rgba(16,185,129,0.08)' }} />
                    <Bar dataKey="count" name="Users" radius={[0, 4, 4, 0]}>
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
