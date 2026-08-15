'use client';

import type { GameMetaMap } from '@/hooks/use-game-meta';
import type { UnfinishedRow } from '@/types/reports';
import { EmptyState } from '@/components/reports/EmptyState';
import { GameBadge } from '@/components/reports/GameBadge';
import { MetricInfo } from '@/components/reports/MetricInfo';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/ReportTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { unfinishedBands } from '@/lib/unfinished-bands';

/**
 * Where the unfinished sessions are sitting, and for how long.
 *
 * Ranked by the STALE pool rather than the total, because the total is not the
 * thing anyone can act on: it includes the last hour, which on a busy game is
 * mostly people currently playing. Ranking by it would put whichever game is
 * busiest right now at the top, every time you looked.
 */
export function UnfinishedTable({ rows, meta }: { rows: UnfinishedRow[]; meta: GameMetaMap }) {
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
                            <GameBadge gameKey={row.game_type} meta={meta} />
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
                          <span className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                            {bands.map(band => (
                              <span key={band.label} className="whitespace-nowrap">
                                {band.label}
                                {': '}
                                <span className="text-foreground">{band.count.toLocaleString()}</span>
                                {` (${band.pct}%)`}
                              </span>
                            ))}
                          </span>
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
