'use client';

import type { GameMetaMap } from '@/hooks/use-game-meta';
import type { FirstSessionResponse } from '@/types/reports';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { GameBadge } from '@/components/reports/primitives/GameBadge';
import { MetricInfo } from '@/components/reports/primitives/MetricInfo';
import { MetricRow } from '@/components/reports/primitives/MetricRow';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/primitives/ReportTable';
import { SmallSampleNotice } from '@/components/reports/primitives/SmallSampleNotice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Which game hooks people onto the platform, rather than onto itself.
 *
 * Sits beside the retention table on purpose, because the two answer questions
 * that are easy to confuse. Retention asks whether people who started a game
 * came back TO THAT GAME. This asks whether they came back at all, split by
 * where they started — so a game can hold nobody itself and still be the best
 * front door on the platform. Reading either alone gets that backwards.
 */
export function FirstSessionFollowup({ data, meta }: { data: FirstSessionResponse; meta: GameMetaMap }) {
  const rows = data.rows;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Where new players start
          <MetricInfo metric="returned_within" />
        </CardTitle>
        <CardDescription>
          First-timers only — their first session anywhere, ever. Coming back for a
          different game counts: the platform kept them, whatever introduced them.
          The windows are cumulative, so everyone in 24h is also in 48h and 7 days.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 overflow-x-auto">
        <MetricRow
          columns={3}
          metrics={[
            { label: 'New players', value: data.total_new_players.toLocaleString(), metric: 'new_players' },
            { label: 'Starting games', value: rows.length.toLocaleString() },
            { label: 'Rate needs', value: `${data.min_players} first-timers` },
          ]}
        />

        {rows.length === 0
          ? (
              <EmptyState hint="Try a wider date range.">
                Nobody played for the first time in this window.
              </EmptyState>
            )
          : (
              <ReportTable>
                <ReportHead>
                  <Th>Started on</Th>
                  <Th align="right">First-timers</Th>
                  <Th align="right" title="Came back to anything within a day">Within 24h</Th>
                  <Th align="right" title="Within two days — includes the 24h column">Within 48h</Th>
                  <Th align="right" title="Within a week — includes both columns to its left">Within 7 days</Th>
                </ReportHead>
                <tbody>
                  {rows.map(row => (
                    <ReportRow key={row.game_type}>
                      <Td strong>
                        <GameBadge
                          gameKey={row.game_type}
                          meta={meta}
                          href={`/reports/games/${row.game_type}`}
                        />
                      </Td>
                      <Td align="right">{row.new_players.toLocaleString()}</Td>
                      {/* The count is always shown and the rate is not: below the
                          threshold one player moves the percentage enough to
                          mislead, but "3 started here" is still a fact. */}
                      {([
                        ['24h', row.returned_24h, row.returned_24h_pct],
                        ['48h', row.returned_48h, row.returned_48h_pct],
                        ['7d', row.returned_168h, row.returned_168h_pct],
                      ] as [string, number, number | null][]).map(([window, count, pct]) => (
                        <Td key={window} align="right">
                          {row.below_threshold
                            ? <SmallSampleNotice have={row.new_players} need={data.min_players} />
                            : (
                                <>
                                  {`${pct}%`}
                                  <span className="ml-1 text-xs text-muted-foreground">
                                    {`(${count.toLocaleString()})`}
                                  </span>
                                </>
                              )}
                        </Td>
                      ))}
                    </ReportRow>
                  ))}
                </tbody>
              </ReportTable>
            )}
      </CardContent>
    </Card>
  );
}
