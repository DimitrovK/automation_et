'use client';

import type { GameMetaMap } from '@/hooks/use-game-meta';
import type { DifficultyResponse, DifficultyRow } from '@/types/reports';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { GameBadge } from '@/components/reports/primitives/GameBadge';
import { MetricInfo } from '@/components/reports/primitives/MetricInfo';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/primitives/ReportTable';
import { SmallSampleNotice } from '@/components/reports/primitives/SmallSampleNotice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * How hard each game is, on the axis it actually records.
 *
 * The platform has been reading completion as difficulty. Conquest reads 99%
 * complete, of which three fifths is a 24-hour timer writing LOSS on sessions
 * the player walked away from — so this panel puts the correction in a column
 * rather than in a footnote, and says how much of the data each win rate is
 * drawn from.
 */

/** Under this, a win rate describes multiplayer rather than the game. */
const THIN_COVERAGE_PCT = 25;

function Rate({ value, suffix = '%' }: { value: number | null; suffix?: string }) {
  if (value === null) {
    return <span className="text-muted-foreground/70">—</span>;
  }
  return <>{`${value}${suffix}`}</>;
}

function WinRate({ row }: { row: DifficultyRow }) {
  if (!row.has_verdict) {
    // Not 0%. A game with no result column would rank as the hardest on the
    // platform, and the reason it has none is that it has no win to record.
    return (
      <span className="text-muted-foreground/70" title="This game records no win or loss — only whether a session ended">
        no verdict
      </span>
    );
  }

  const thin = row.verdict_coverage_pct !== null && row.verdict_coverage_pct < THIN_COVERAGE_PCT;
  return (
    <>
      <Rate value={row.win_rate_pct} />
      {row.verdict_coverage_pct !== null && (
        <span
          className={thin ? 'mt-0.5 block text-xs font-normal text-amber-600 dark:text-amber-500' : 'mt-0.5 block text-xs font-normal text-muted-foreground'}
          title={
            thin
              ? 'This game writes its result for multiplayer rounds only, so the rate describes multiplayer rather than the game'
              : 'The share of sessions this rate is computed from'
          }
        >
          {`from ${row.verdict_coverage_pct}% of sessions`}
        </span>
      )}
    </>
  );
}

export function DifficultyOutcomes({ data, meta }: { data: DifficultyResponse; meta: GameMetaMap }) {
  const rows = data.rows.filter(row => row.sessions > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          How hard each game is
          <MetricInfo metric="win_rate" />
        </CardTitle>
        <CardDescription>
          Completion is not difficulty. Sessions a sweeper closed are excluded from
          both rates and counted separately — a timer ending a session is not a
          player finishing one.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 overflow-x-auto">
        {rows.length === 0
          ? (
              <EmptyState hint="Try a wider date range.">
                Nothing was played in this window.
              </EmptyState>
            )
          : (
              <ReportTable>
                <ReportHead>
                  <Th>Game</Th>
                  <Th align="right">Sessions</Th>
                  <Th align="right" title="Sessions the player finished — swept ones excluded">Completed</Th>
                  <Th align="right" title="Closed by the game's idle timer, not by the player">Closed by timer</Th>
                  <Th align="right" title="Of sessions that reached a verdict a player produced">Won</Th>
                </ReportHead>
                <tbody>
                  {rows.map(row => (
                    <ReportRow key={row.game_type}>
                      <Td strong>
                        <GameBadge gameKey={row.game_type} meta={meta} href={`/reports/games/${row.game_type}`} />
                      </Td>
                      <Td align="right">{row.sessions.toLocaleString()}</Td>
                      <Td align="right" strong><Rate value={row.completion_pct} /></Td>
                      <Td align="right" className="text-muted-foreground">
                        {row.sweeper_hours === null
                          ? <span className="text-muted-foreground/70" title="This game has no sweeper">—</span>
                          : (
                              <>
                                {row.swept.toLocaleString()}
                                <span className="mt-0.5 block text-xs">{`after ${row.sweeper_hours}h idle`}</span>
                              </>
                            )}
                      </Td>
                      <Td align="right"><WinRate row={row} /></Td>
                    </ReportRow>
                  ))}
                </tbody>
              </ReportTable>
            )}

        {rows.filter(row => row.difficulty.length > 0).map(row => (
          <div key={row.game_type} className="space-y-2 border-t pt-4">
            <p className="flex items-center gap-2 text-sm font-medium">
              <GameBadge gameKey={row.game_type} meta={meta} href={`/reports/games/${row.game_type}`} />
              <span className="text-muted-foreground">{`by ${row.difficulty_label?.toLowerCase()}`}</span>
            </p>
            <ReportTable>
              <ReportHead>
                <Th>{row.difficulty_label}</Th>
                <Th align="right">Sessions</Th>
                <Th align="right">Completed</Th>
                {row.has_verdict && <Th align="right">Won</Th>}
              </ReportHead>
              <tbody>
                {row.difficulty.map(bucket => (
                  <ReportRow key={String(bucket.value)}>
                    <Td strong>
                      {/* Not recorded is a value, not a gap: on Missing Team it
                          is the biggest bucket there is, and dropping it would
                          make the tiers look like the whole game. */}
                      {bucket.value ?? <span className="text-muted-foreground">Not recorded</span>}
                      {bucket.off_scale && (
                        <span
                          className="ml-1.5 text-xs font-normal text-amber-600 dark:text-amber-500"
                          title="Not in the scale this game declares — a new difficulty nobody wired up, or a typo"
                        >
                          off scale
                        </span>
                      )}
                    </Td>
                    <Td align="right">{bucket.sessions.toLocaleString()}</Td>
                    <Td align="right">
                      {bucket.below_threshold
                        ? <SmallSampleNotice have={bucket.sessions} need={data.min_sessions} unit="sessions" />
                        : <Rate value={bucket.completion_pct} />}
                    </Td>
                    {row.has_verdict && (
                      <Td align="right"><Rate value={bucket.win_rate_pct} /></Td>
                    )}
                  </ReportRow>
                ))}
              </tbody>
            </ReportTable>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
