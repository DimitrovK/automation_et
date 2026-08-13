'use client';

import type { GameMetaMap } from '@/hooks/use-game-meta';
import type { GameTotals } from '@/types/reports';
import { useMemo } from 'react';
import { useTheme } from 'next-themes';
import {
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { ChartTooltip } from '@/components/reports/ChartTooltip';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { gameColor, gameName } from '@/hooks/use-game-meta';
import { chartTheme } from '@/lib/chart-theme';
import { QUADRANT_LABELS, reachDepth, reachDepthContrast } from '@/lib/reach-depth';

/**
 * Reach against depth — how many people played a game, against how much each of
 * them played it.
 *
 * The games table ranks by volume, and volume hides this: two games with the
 * same session count can have opposite problems. A game reaching 227 players
 * who play it 7 times each has an audience it isn't holding; one reaching 77
 * who play it 39 times each has devotion it isn't spreading. Ranked by
 * sessions, both read as mid-table and neither problem is visible.
 *
 * A scatter is the honest form here: two measures per game, no ordering
 * implied. The crosshairs are medians rather than means, because one runaway
 * game would drag a mean and re-label everything around it.
 *
 * Four of the eleven registry colours sit below 3:1 against the card, which is
 * legal only with relief — so every point is named in the quadrant list below
 * the plot and in its tooltip. Colour here confirms identity; it never carries
 * it alone.
 */
export function ReachDepthChart({ rows, meta }: { rows: GameTotals[]; meta: GameMetaMap }) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const theme = chartTheme(isDark);

  const { points, medianReach, medianDepth } = useMemo(() => reachDepth(rows), [rows]);
  const contrast = useMemo(() => reachDepthContrast(points), [points]);

  const data = useMemo(
    () => points.map(point => ({
      ...point,
      name: gameName(meta[point.game_type], point.game_type),
      fill: gameColor(meta[point.game_type], isDark),
      quadrantLabel: QUADRANT_LABELS[point.quadrant],
    })),
    [points, meta, isDark],
  );

  if (points.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Reach vs depth</CardTitle>
        <CardDescription>
          How many people played each game, against how often each of them played it.
          {contrast && (
            <>
              {' '}
              {gameName(meta[contrast.broadest.game_type], contrast.broadest.game_type)}
              {' reached the most players ('}
              {contrast.broadest.reach.toLocaleString()}
              {', '}
              {contrast.broadest.depth.toFixed(1)}
              {' sessions each); '}
              {gameName(meta[contrast.deepest.game_type], contrast.deepest.game_type)}
              {' is played most per person ('}
              {contrast.deepest.reach.toLocaleString()}
              {' players, '}
              {contrast.deepest.depth.toFixed(1)}
              {' each). Opposite problems, and a volume ranking shows neither.'}
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 8, right: 24, bottom: 24, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.grid.stroke} />
              <XAxis
                type="number"
                dataKey="reach"
                name="Players"
                tick={theme.tick}
                label={{ value: 'Players reached', position: 'insideBottom', offset: -12, fill: theme.tick.fill, fontSize: 11 }}
              />
              <YAxis
                type="number"
                dataKey="depth"
                name="Sessions per player"
                tick={theme.tick}
                width={44}
                label={{ value: 'Sessions each', angle: -90, position: 'insideLeft', fill: theme.tick.fill, fontSize: 11 }}
              />
              {/* Bubble size carries total sessions — the thing a volume ranking
                  would have shown, kept as a third dimension so this chart
                  replaces nothing. */}
              <ZAxis type="number" dataKey="sessions" range={[60, 400]} name="Sessions" />
              <ReferenceLine
                x={medianReach}
                stroke={theme.grid.stroke}
                strokeDasharray="4 4"
                label={{ value: 'median reach', position: 'top', fill: theme.tick.fill, fontSize: 10 }}
              />
              <ReferenceLine
                y={medianDepth}
                stroke={theme.grid.stroke}
                strokeDasharray="4 4"
                label={{ value: 'median depth', position: 'right', fill: theme.tick.fill, fontSize: 10 }}
              />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={(
                  <ChartTooltip
                    labelFormatter={() => ''}
                    footer={row => (typeof row.quadrantLabel === 'string' && typeof row.name === 'string'
                      ? `${row.name} — ${row.quadrantLabel}`
                      : null)}
                  />
                )}
              />
              <Scatter data={data} name="Games">
                {data.map(point => (
                  <Cell key={point.game_type} fill={point.fill} fillOpacity={0.75} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* The quadrants named, with their members. The chart shows position;
            this says what a position means, which is the part worth carrying
            away from it. */}
        <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          {(Object.keys(QUADRANT_LABELS) as (keyof typeof QUADRANT_LABELS)[]).map((quadrant) => {
            const members = data.filter(point => point.quadrant === quadrant);
            return (
              <div key={quadrant}>
                <dt className="font-medium text-gray-900 dark:text-white">{QUADRANT_LABELS[quadrant]}</dt>
                <dd className="text-gray-600 dark:text-gray-300">
                  {members.length === 0
                    ? <span className="text-gray-400 dark:text-gray-500">none</span>
                    : members.map(point => point.name).join(', ')}
                </dd>
              </div>
            );
          })}
        </dl>
      </CardContent>
    </Card>
  );
}
