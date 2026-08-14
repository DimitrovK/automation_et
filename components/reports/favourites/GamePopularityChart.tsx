'use client';

import type { GameMetaMap } from '@/hooks/use-game-meta';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '@/components/reports/ChartTooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { chartTheme } from '@/lib/chart-theme';
import { popularityRows } from '@/lib/favourites-chart';

type Props = {
  /** favourites slug → number of users who favourited it. */
  gamePopularity: Record<string, number>;
  /** The game registry, keyed by favourites slug (see `byFavouriteSlug`). */
  meta: GameMetaMap;
  /** When set, bars become clickable and call this with the game slug. */
  onGameSelect?: (slug: string) => void;
};

/**
 * How many users favourited each game.
 *
 * Each bar is drawn in that game's registry colour, so Grid is the same orange
 * here as on every other reports page. This chart used to cycle a local
 * ten-colour array by rank — which meant the colours moved when the ranking
 * did, and matched nothing else in the section.
 */
export function GamePopularityChart({ gamePopularity, meta, onGameSelect }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const theme = chartTheme(isDark);

  const data = useMemo(
    () => popularityRows(gamePopularity, meta, isDark),
    [gamePopularity, meta, isDark],
  );
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
        <p className="text-xs text-muted-foreground">
          Users who have this game in their favourites.
          {interactive && ' Click a game to see who.'}
        </p>
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
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={theme.grid.stroke} />
                    <XAxis type="number" allowDecimals={false} tick={theme.tick} />
                    <YAxis type="category" dataKey="label" width={140} tick={theme.tick} />
                    <Tooltip
                      cursor={theme.tooltip.cursor}
                      content={(
                        <ChartTooltip
                          valueFormatter={value => `${value} ${value === 1 ? 'user' : 'users'}`}
                        />
                      )}
                    />
                    <Bar
                      dataKey="count"
                      name="Favourited by"
                      radius={[0, 4, 4, 0]}
                      onClick={interactive ? handleBarClick : undefined}
                      className={interactive ? 'cursor-pointer' : undefined}
                    >
                      {data.map(row => (
                        <Cell key={row.slug} fill={row.fill} />
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
