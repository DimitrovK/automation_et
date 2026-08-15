'use client';

import type { GameMetaMap } from '@/hooks/use-game-meta';
import type { UnfinishedRow } from '@/types/reports';
import { Distribution } from '@/components/reports/primitives/Distribution';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { GameBadge } from '@/components/reports/primitives/GameBadge';
import { MetricInfo } from '@/components/reports/primitives/MetricInfo';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/primitives/ReportTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGameColor } from '@/hooks/use-game-meta';
import { unfinishedBands } from '@/lib/unfinished-bands';

/**
 * Where the unfinished sessions are sitting, and for how long.
 *
 * Ranked by the STALE pool rather than the total, because the total is not the
 * thing anyone can act on: it includes the last hour, which on a busy game is
 * mostly people currently playing. Ranking by it would put whichever game is
 * busiest right now at the top, every time you looked.
 */
export function UnfinishedTable({ rows, meta, asOf, totalStale }: {
  rows: UnfinishedRow[];
  meta: GameMetaMap;
  /** When the snapshot was taken. */
  asOf: string;
  /** Platform total, older than an hour. */
  totalStale: number;
}) {
  const resolveColor = useGameColor();
  const withPool = rows.filter(row => row.unfinished > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Sitting unfinished
          <MetricInfo metric="stale_sessions" />
        </CardTitle>
        <CardDescription>
          A snapshot of right now, not a figure for a window. The last hour is kept
          separate — on a busy game most of it is people still playing.
          {' '}
          {/* The timestamp travels with the panel rather than living on a page:
              a snapshot with no time on it cannot be judged, and a tab left open
              for an hour looks identical to one opened a second ago. */}
          {`${totalStale.toLocaleString()} sitting unfinished as of ${new Date(asOf).toLocaleString(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {withPool.length === 0
          ? <EmptyState>Nothing is sitting unfinished.</EmptyState>
          : (
              <ReportTable>
                <ReportHead>
                  <Th>Game</Th>
                  <Th align="right">Stale</Th>
                  <Th align="right" title="Started within the last hour — probably still being played">Last hour</Th>
                  <Th>How long they have sat</Th>
                </ReportHead>
                <tbody>
                  {withPool.map((row) => {
                    const bands = unfinishedBands(row.buckets);

                    return (
                      <ReportRow key={row.game_type}>
                        <Td strong>
                          <span className="flex items-center gap-2">
                            <GameBadge gameKey={row.game_type} meta={meta} href={`/reports/games/${row.game_type}`} />
                            {/* Stated on the row, not in a footnote: a game whose
                                sweeper closes idle sessions cannot accumulate an
                                old pool, so its number is not comparable with a
                                game that never sweeps. Rank without knowing that
                                and the swept game reads as the healthiest here. */}
                            {row.sweeper_hours !== null && (
                              <span className="whitespace-nowrap text-xs font-normal text-muted-foreground">
                                {`swept after ${row.sweeper_hours}h`}
                              </span>
                            )}
                          </span>
                        </Td>
                        <Td align="right">{row.stale_sessions.toLocaleString()}</Td>
                        <Td align="right" className="text-muted-foreground">
                          {row.recent_sessions.toLocaleString()}
                        </Td>
                        <Td>
                          {/* Was the same counts printed as a line of text. The
                              shape is the point — "most of this pool is over a
                              week old" is a glance, not a sentence to parse. */}
                          <Distribution bands={bands} colour={resolveColor(meta, row.game_type)} />
                        </Td>
                      </ReportRow>
                    );
                  })}
                </tbody>
              </ReportTable>
            )}
      </CardContent>
    </Card>
  );
}
