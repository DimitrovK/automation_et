'use client';

import type { GameMetaMap } from '@/hooks/use-game-meta';
import type { GameTotals } from '@/types/reports';
import { useMemo } from 'react';
import { GameBadge } from '@/components/reports/GameBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { gameName, useGameColor } from '@/hooks/use-game-meta';
import { abandonedSessions, sessionsPerPoint } from '@/lib/abandoned';

/**
 * Where the unfinished sessions are.
 *
 * Every number here was already in the reports and none of them said this.
 * missing11 runs at 61.7% completion — mid-table beside games at 55% — but it
 * is a quarter of all play, so its abandoned sessions are the largest single
 * pool on the platform. Ranked by rate it looks ordinary; ranked by volume it
 * looks healthy; the pool itself was on no screen at all.
 *
 * Bars encode the pool itself — abandoned sessions, not sessions played —
 * scaled to the largest pool, so the comparison between games uses the full
 * width available. Each game's share of all abandonment is the % column beside
 * it; putting that on the bar instead would leave even the biggest one at a
 * third of the track and make the smaller games unreadable.
 *
 * Completion rate rides alongside as context, not as the ranking — a poor rate
 * on a small game is not a lever.
 */
export function AbandonedPanel({ rows, meta }: { rows: GameTotals[]; meta: GameMetaMap }) {
  const resolveColor = useGameColor();
  const { rows: abandoned, totalAbandoned, lever } = useMemo(() => abandonedSessions(rows), [rows]);

  if (abandoned.length === 0) {
    return null;
  }

  const max = abandoned[0].abandoned;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Where the losses are</CardTitle>
        <CardDescription>
          {totalAbandoned.toLocaleString()}
          {' sessions were started and not finished in this window. '}
          {lever
            ? (
                <>
                  {gameName(meta[lever.game_type], lever.game_type)}
                  {' holds '}
                  {lever.share_of_abandoned_pct}
                  {'% of them — '}
                  {lever.abandoned.toLocaleString()}
                  {' sessions. Two points of completion there is '}
                  {sessionsPerPoint(lever, 2).toLocaleString()}
                  {' sessions, on this window’s volume.'}
                </>
              )
            // Two comparable pools: naming one of them "the" lever would be a
            // coin toss dressed up as a finding.
            : 'No single game dominates the pool — the top games are within a few points of each other.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {abandoned.map(row => (
            <li key={row.game_type} className="flex flex-wrap items-center gap-3 text-sm">
              <span className="min-w-40 flex-1">
                <GameBadge gameKey={row.game_type} meta={meta} />
              </span>
              <span className="h-2 w-full max-w-64 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${max > 0 ? Math.max(2, (row.abandoned / max) * 100) : 0}%`,
                    backgroundColor: resolveColor(meta, row.game_type),
                  }}
                />
              </span>
              <span className="w-20 text-right font-medium tabular-nums text-foreground">
                {row.abandoned.toLocaleString()}
              </span>
              <span className="w-14 text-right tabular-nums text-muted-foreground">
                {row.share_of_abandoned_pct}
                %
              </span>
              {/* Context, not ranking: the rate says how hard the pool would be
                  to shrink, the pool says how much there is to win. */}
              <span className="w-24 text-right tabular-nums text-muted-foreground">
                {row.completion_pct === null ? '—' : `${row.completion_pct}% done`}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
