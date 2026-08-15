'use client';

import type { GameMetaMap } from '@/hooks/use-game-meta';
import type { RetentionGameRow, RetentionResponse, RetentionSummaryCell } from '@/types/reports';
import { GameBadge } from '@/components/reports/GameBadge';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/ReportTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * One offset's cell, or null when the backend didn't send that offset.
 *
 * The lookup is by a string built from `offsets`, so it has to be widened to
 * the row's key type — and the null branch is real: a response can list an
 * offset the rows don't carry, and reading `undefined.pct` would blank the
 * whole table rather than one cell.
 */
function cell(row: RetentionGameRow, key: string): RetentionSummaryCell | null {
  return row[key as `d${number}`] ?? null;
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
        <CardTitle>Which games keep people</CardTitle>
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
        <ReportTable>
          <ReportHead>
            <Th>Game</Th>
            {offsets.map(key => (
              <Th key={key} align="right" className="uppercase">{key}</Th>
            ))}
            <Th align="right">Players</Th>
          </ReportHead>
          <tbody>
            {rows.map((row) => {
              // The first offset the row actually carries, not the first one
              // listed: they are the same set today, and a row missing the
              // leading offset would otherwise report a cohort of zero for a
              // game that has players.
              const players = offsets.reduce<number>(
                (found, key) => found || (cell(row, key)?.players ?? 0),
                0,
              );
              return (
                <ReportRow key={row.game_type}>
                  <Td>
                    <GameBadge gameKey={row.game_type} meta={meta} href={`/reports/games/${row.game_type}`} />
                  </Td>
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
                      <Td key={key} align="right">
                        {pct === null
                          ? (
                              <span
                                className="text-muted-foreground/70"
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
                      </Td>
                    );
                  })}
                  <Td align="right" className="text-muted-foreground">
                    {players.toLocaleString()}
                  </Td>
                </ReportRow>
              );
            })}
          </tbody>
          <tfoot>
            <ReportRow className="text-muted-foreground">
              <Td className="text-xs">Median across games</Td>
              {offsets.map(key => (
                <Td key={key} align="right" className="text-xs">
                  {median[key] === null || median[key] === undefined ? '—' : `${median[key]}%`}
                </Td>
              ))}
              <Td />
            </ReportRow>
          </tfoot>
        </ReportTable>
        <p className="mt-3 text-xs text-muted-foreground">
          {`A dash means no rate could be stated: either no cohort has reached that offset yet, or the game had fewer than ${data.min_players ?? 20} measurable players — one of three returning is 33%, which beside a game with hundreds reads as a finding rather than as noise.`}
        </p>
      </CardContent>
    </Card>
  );
}
