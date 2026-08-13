'use client';

import type { GameMetaMap } from '@/hooks/use-game-meta';
import type { DurationResponse } from '@/types/reports';
import { useState } from 'react';
import { GameBadge } from '@/components/reports/GameBadge';
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
  const measurable = data.rows.filter(row => row.supported && row.measured > 0 && (row.buckets?.length ?? 0) > 0);
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
        <CardTitle className="text-base">Session length, distributed</CardTitle>
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
              <span className="w-28 shrink-0 text-right text-xs text-gray-600 dark:text-gray-300">{band.label}</span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
                <span
                  className="block h-full rounded-full"
                  style={{
                    width: `${(band.count / max) * 100}%`,
                    backgroundColor: resolveColor(meta, row.game_type),
                  }}
                />
              </span>
              <span className="w-16 shrink-0 text-right text-xs tabular-nums text-gray-500 dark:text-gray-400">
                {band.count.toLocaleString()}
              </span>
              <span className="w-12 shrink-0 text-right text-xs tabular-nums text-gray-400 dark:text-gray-500">
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
