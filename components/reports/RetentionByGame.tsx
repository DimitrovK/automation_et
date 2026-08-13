'use client';

import type { GameMetaMap } from '@/hooks/use-game-meta';
import type { RetentionResponse, RetentionSummaryCell } from '@/types/reports';
import { GameBadge } from '@/components/reports/GameBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function cell(row: Record<string, unknown>, key: string): RetentionSummaryCell | null {
  const value = row[key];
  return value && typeof value === 'object' ? (value as RetentionSummaryCell) : null;
}

/**
 * Which games keep people.
 *
 * The platform figure says whether the site keeps players; it cannot say what
 * they came back to. A game with a strong first day and nothing after it is a
 * different problem from a game nobody starts, and one average across eleven
 * games hides both.
 *
 * Each game is measured on its OWN cohorts — players whose first day in that
 * game was X, returning to that game — so this is not a decomposition of the
 * platform number and does not sum to it.
 */
export function RetentionByGame({ data, meta }: { data: RetentionResponse; meta: GameMetaMap }) {
  const rows = data.by_game ?? [];
  if (rows.length === 0) {
    return null;
  }

  const offsets = data.offsets.map(offset => `d${offset}`);
  const median = data.game_median ?? {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Which games keep people</CardTitle>
        <CardDescription>
          Each game measured on its own players: of those whose first day in it was X, how
          many came back to
          {' '}
          <em>it</em>
          . Best keeper first. These don't sum to the platform figure above — that one counts
          a return to any game, from a different set of cohorts, so a game can sit either
          side of it.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-600 dark:border-slate-700 dark:text-gray-300">
              <th className="py-2 pr-4 font-medium">Game</th>
              {offsets.map(key => (
                <th key={key} className="py-2 pr-4 text-right font-medium uppercase">{key}</th>
              ))}
              <th className="py-2 text-right font-medium">Players</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const players = cell(row, offsets[0])?.players ?? 0;
              return (
                <tr key={row.game_type} className="border-b last:border-0 dark:border-slate-700">
                  <td className="py-2 pr-4">
                    <GameBadge gameKey={row.game_type} meta={meta} />
                  </td>
                  {offsets.map((key) => {
                    const value = cell(row, key);
                    const pct = value?.pct ?? null;
                    const peer = median[key];
                    // Above or below its peers, which is the only reference
                    // this data can defend. No colour where there is no peer
                    // median to compare with.
                    const above = pct !== null && peer !== null && peer !== undefined && pct > peer;
                    const below = pct !== null && peer !== null && peer !== undefined && pct < peer;
                    return (
                      <td key={key} className="py-2 pr-4 text-right tabular-nums">
                        {pct === null
                          ? (
                              <span
                                className="text-gray-400 dark:text-gray-500"
                                title={value?.below_threshold
                                  ? `Only ${value.players} players — too few to state a rate`
                                  : 'No cohort has reached this offset yet'}
                              >
                                —
                              </span>
                            )
                          : (
                              <span className={cn(
                                above ? 'text-emerald-700 dark:text-emerald-400' : '',
                                below ? 'text-amber-700 dark:text-amber-400' : '',
                              )}
                              >
                                {pct}
                                %
                              </span>
                            )}
                      </td>
                    );
                  })}
                  <td className="py-2 text-right tabular-nums text-gray-500 dark:text-gray-400">
                    {players.toLocaleString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="text-gray-500 dark:text-gray-400">
              <td className="py-2 pr-4 text-xs">Median across games</td>
              {offsets.map(key => (
                <td key={key} className="py-2 pr-4 text-right text-xs tabular-nums">
                  {median[key] === null || median[key] === undefined ? '—' : `${median[key]}%`}
                </td>
              ))}
              <td />
            </tr>
          </tfoot>
        </table>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          {`A dash means no rate could be stated: either no cohort has reached that offset yet, or the game had fewer than ${data.min_players ?? 20} measurable players — one of three returning is 33%, which beside a game with hundreds reads as a finding rather than as noise.`}
        </p>
      </CardContent>
    </Card>
  );
}
