'use client';

import type { GameMetaMap } from '@/hooks/use-game-meta';
import type { DurationResponse } from '@/types/reports';
import { useState } from 'react';
import { GameBadge } from '@/components/reports/primitives/GameBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { gameName, useGameColor } from '@/hooks/use-game-meta';
import { durationHistogram } from '@/lib/duration-histogram';

/**
 * How one game's session lengths are distributed.
 *
 * The table says where the middle half sits; this says what the whole shape
 * looks like — one hump, two, or a long tail. Conquest's tail is the clearest
 * case on the platform: 401 sessions past six hours against 156 below, which is
 * its idle sweeper rather than anything a player did.
 *
 * One game at a time on purpose. Eleven overlaid distributions is a picture
 * nobody reads, and the question here is "what does THIS game look like".
 */
export function DurationHistogram({ data, meta }: { data: DurationResponse; meta: GameMetaMap }) {
  const resolveColor = useGameColor();
  // Summed counts, not just "has bands": a row whose bands are all zero would
  // put a chip in the selector and then draw an empty card, which reads as a
  // broken chart. The backend's bands sum to `measured` today, so this can only
  // trigger on a response that breaks that — which is exactly when a component
  // should not be relying on the invariant.
  const measurable = data.rows.filter(
    row => row.supported && (row.buckets ?? []).reduce((sum, bucket) => sum + bucket.count, 0) > 0,
  );
  const [selected, setSelected] = useState<string | null>(null);

  if (measurable.length === 0) {
    return null;
  }

  const row = measurable.find(candidate => candidate.game_type === selected) ?? measurable[0];
  const bands = durationHistogram(row);
  const max = Math.max(...bands.map(band => band.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session length, distributed</CardTitle>
        <CardDescription>
          {`How ${gameName(meta[row.game_type], row.game_type)}'s ${row.measured.toLocaleString()} measured sessions spread out. `}
          A median tells you the middle; this tells you whether there is one kind of session or several.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-1">
          {measurable.map(candidate => (
            <GameBadge
              key={candidate.game_type}
              gameKey={candidate.game_type}
              meta={meta}
              active={candidate.game_type === row.game_type}
              onClick={key => setSelected(key)}
            />
          ))}
        </div>

        <ul className="space-y-1.5">
          {bands.map(band => (
            <li key={band.label} className="flex items-center gap-3 text-sm">
              <span className="w-28 shrink-0 text-right text-xs text-muted-foreground">{band.label}</span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${(band.count / max) * 100}%`,
                    backgroundColor: resolveColor(meta, row.game_type),
                  }}
                />
              </span>
              <span className="w-16 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                {band.count.toLocaleString()}
              </span>
              <span className="w-12 shrink-0 text-right text-xs tabular-nums text-muted-foreground/70">
                {band.pct}
                %
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
