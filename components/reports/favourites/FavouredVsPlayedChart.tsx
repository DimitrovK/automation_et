'use client';

import type { GameMetaMap } from '@/hooks/use-game-meta';
import type { FavouredVsPlayedResponse } from '@/types/user-hub';
import { useTheme } from 'next-themes';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '@/components/reports/ChartTooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { gameName } from '@/hooks/use-game-meta';
import { chartTheme } from '@/lib/chart-theme';
import { sortEngagementRows } from '@/lib/user-hub-analytics';

type Props = {
  data: FavouredVsPlayedResponse | null;
  isLoading: boolean;
  error: string | null;
  notDeployed: boolean;
  /** The game registry, keyed by favourites slug (see `byFavouriteSlug`). */
  meta: GameMetaMap;
  onRetry: () => void;
};

/**
 * Favourited → started → finished is a funnel, so the three series are one hue
 * in three steps rather than three unrelated colours: the ramp says "same
 * quantity, further along" where emerald/blue/amber said "three separate
 * things". Each set is validated against its own surface — a dark card needs
 * its own steps, and the light ramp inverts there (on dark, brighter reads as
 * deeper, not lighter).
 */
const FUNNEL_LIGHT = ['#10b981', '#047857', '#064e3b'];
const FUNNEL_DARK = ['#065f46', '#10b981', '#6ee7b7'];

export function FavouredVsPlayedChart({ data, isLoading, error, notDeployed, meta, onRetry }: Props) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const theme = chartTheme(isDark);
  const funnel = isDark ? FUNNEL_DARK : FUNNEL_LIGHT;

  const rows = useMemo(() => (data ? sortEngagementRows(data.games) : []), [data]);

  if (notDeployed) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Favourited vs played</CardTitle>
        <p className="text-xs text-muted-foreground">
          Of the users who favourited a game, how many started it and how many finished.
          A wide gap between the first two bars is a game people mean to play and don't.
        </p>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-72 w-full" />}

        {error && !isLoading && (
          <div role="alert" className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            {error}
            <div className="mt-2">
              <Button size="sm" variant="outline" onClick={onRetry}>Retry</Button>
            </div>
          </div>
        )}

        {!isLoading && !error && rows.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No engagement data yet.</p>
        )}

        {!isLoading && !error && rows.length > 0 && (
          <div style={{ height: Math.max(200, rows.length * 56) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke={theme.grid.stroke} />
                <XAxis type="number" allowDecimals={false} tick={theme.tick} />
                <YAxis
                  type="category"
                  dataKey="slug"
                  width={140}
                  tick={theme.tick}
                  tickFormatter={slug => gameName(meta[slug], slug)}
                />
                <Tooltip
                  cursor={theme.tooltip.cursor}
                  content={(
                    <ChartTooltip
                      labelFormatter={slug => gameName(meta[String(slug)], String(slug))}
                      // The number the three bars are actually asked about:
                      // of those who favourited it, how many saw it through.
                      // Narrowed rather than interpolated: a missing field would
                      // otherwise render "Play-through: undefined%", which reads
                      // as a value rather than as an absence.
                      footer={row => (typeof row.play_through_pct === 'number'
                        ? `Play-through: ${row.play_through_pct}%`
                        : null)}
                    />
                  )}
                />
                <Legend wrapperStyle={theme.legend} />
                <Bar dataKey="favourited_count" name="Favourited" fill={funnel[0]} radius={[0, 3, 3, 0]} />
                <Bar dataKey="started_count" name="Started" fill={funnel[1]} radius={[0, 3, 3, 0]} />
                <Bar dataKey="finished_count" name="Finished" fill={funnel[2]} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
