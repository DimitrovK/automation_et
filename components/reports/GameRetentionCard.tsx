'use client';

import type { RetentionGameRow, RetentionResponse, RetentionSummaryCell } from '@/types/reports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function cell(row: RetentionGameRow, key: string): RetentionSummaryCell | null {
  return row[key as `d${number}`] ?? null;
}

/**
 * Does this game keep the people who try it?
 *
 * Read against the median of the other games rather than against the platform
 * figure. The platform number counts a return to anything, from cohorts defined
 * by a player's first day anywhere, so a game can sit either side of it —
 * comparing to it would be arithmetic between two questions.
 */
export function GameRetentionCard({ data, gameKey, gameLabel }: {
  data: RetentionResponse;
  gameKey: string;
  gameLabel: string;
}) {
  const row = data.by_game?.find(candidate => candidate.game_type === gameKey);
  if (!row) {
    return null;
  }

  const median = data.game_median ?? {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Does it keep people?</CardTitle>
        <CardDescription>
          {`Of the players whose first ${gameLabel} day was X, how many came back to it. `}
          Compared with the median across games — not the platform figure, which counts a
          return to any game and answers a different question.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {data.offsets.map((offset) => {
            const key = `d${offset}`;
            const value = cell(row, key);
            const pct = value?.pct ?? null;
            const peer = median[key];
            const hasPeer = peer !== null && peer !== undefined;
            const delta = pct !== null && hasPeer ? Math.round((pct - peer) * 10) / 10 : null;

            return (
              <div key={key}>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  {`Day ${offset}`}
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {pct === null ? '—' : `${pct}%`}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {pct === null
                    ? (value?.below_threshold
                        ? `only ${value.players} players — too few to state a rate`
                        : 'no cohort has reached this day yet')
                    : (
                        <>
                          {value?.players.toLocaleString()}
                          {' players · '}
                          {hasPeer
                            ? (
                                <span className={cn(
                                  delta! > 0 ? 'text-emerald-700 dark:text-emerald-400' : '',
                                  delta! < 0 ? 'text-amber-700 dark:text-amber-400' : '',
                                )}
                                >
                                  {delta! > 0 ? '+' : ''}
                                  {delta}
                                  {' vs median '}
                                  {peer}
                                  %
                                </span>
                              )
                            : 'no peer median to compare with'}
                        </>
                      )}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
