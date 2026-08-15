'use client';

import type { GameMetaMap } from '@/hooks/use-game-meta';
import type { ContentResponse, ContentRow, FallbacksResponse } from '@/types/reports';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { GameBadge } from '@/components/reports/primitives/GameBadge';
import { MetricInfo } from '@/components/reports/primitives/MetricInfo';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/primitives/ReportTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Whether a game is running out of material people have not seen.
 *
 * Runway rather than coverage, and the panel has to make that legible: Missing11
 * has 458 lineups and has served every one of them, which a coverage bar would
 * draw as full on the day the game runs dry.
 */

function Runway({ row }: { row: ContentRow }) {
  if (!row.scheduled) {
    // A pooled game has no calendar to have a runway against. A dash here
    // rather than a zero, which would read as "out of content".
    return (
      <span className="text-muted-foreground/70" title="This game draws from a pool with no schedule, so it has no runway — read its unused count instead">
        no schedule
      </span>
    );
  }

  if (row.dry) {
    const days = row.runway_days === null ? null : Math.abs(row.runway_days);
    return (
      <span className="font-medium text-rose-600 dark:text-rose-400">
        {days === null ? 'Nothing staged' : `Dry ${days}d`}
        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
          nothing new since
          {' '}
          {row.last_staged ?? 'ever'}
        </span>
      </span>
    );
  }

  // `row.low` rather than comparing against the threshold here: the server owns
  // where the line sits, and a client that re-derives it drifts the first time
  // that changes.
  return (
    <span className={row.low ? 'font-medium text-amber-600 dark:text-amber-500' : undefined}>
      {`${row.runway_days}d`}
      <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
        {`${(row.staged_ahead ?? 0).toLocaleString()} staged`}
      </span>
    </span>
  );
}

export function ContentHealth({ data, meta }: { data: ContentResponse; meta: GameMetaMap }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Are we running out of material
          <MetricInfo metric="content_runway" />
        </CardTitle>
        <CardDescription>
          {`Days of staged content, not the share of the catalogue used — a game that has served every item it owns is out of material, not fully covered. Amber under ${data.warning_days} days.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 overflow-x-auto">
        {/* The answer before the table. Someone opening this panel is asking
            "is anything about to run out", and a five-row table makes them
            work it out. */}
        <p className="text-sm">
          {data.games_running_low.length === 0
            ? 'Every game has material staged or in the pool.'
            : `${data.games_running_low.length === 1 ? '1 game is' : `${data.games_running_low.length} games are`} running low.`}
        </p>

        {data.rows.length === 0
          ? <EmptyState>No game declares a content pool.</EmptyState>
          : (
              <ReportTable>
                <ReportHead>
                  <Th>Game</Th>
                  <Th align="right" title="Days until the last staged item goes live">Runway</Th>
                  <Th align="right">In the catalogue</Th>
                  <Th align="right" title="Never served to anyone">Unused</Th>
                  <Th align="right" title="At their run cap and unusable">Used up</Th>
                </ReportHead>
                <tbody>
                  {data.rows.map(row => (
                    <ReportRow key={row.game_type}>
                      <Td strong>
                        <GameBadge gameKey={row.game_type} meta={meta} href={`/reports/games/${row.game_type}`} />
                        {row.topped_up_by_a_job && (
                          // A shrinking pool here is a broken job, not a content
                          // shortage — a different alert with a different owner,
                          // and filing it under "write more content" wastes a
                          // week before anyone checks the scheduler.
                          <span
                            className="mt-0.5 block text-xs font-normal text-muted-foreground"
                            title="This pool is refilled automatically every few minutes — if it shrinks, check the job before writing more content"
                          >
                            machine-filled
                          </span>
                        )}
                      </Td>
                      <Td align="right"><Runway row={row} /></Td>
                      <Td align="right">
                        {row.total.toLocaleString()}
                        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                          {`${row.item}s`}
                        </span>
                      </Td>
                      <Td align="right">{row.unused.toLocaleString()}</Td>
                      <Td align="right" className="text-muted-foreground">
                        {row.exhausted.toLocaleString()}
                      </Td>
                    </ReportRow>
                  ))}
                </tbody>
              </ReportTable>
            )}
      </CardContent>
    </Card>
  );
}

/**
 * Material that exists but cannot be used.
 *
 * The sharpest form of content exhaustion: a challenge that cannot produce four
 * plausible options is served as something harder than what was configured, and
 * until now the only trace was a log line.
 */
export function FormatFallbacks({ data }: { data: FallbacksResponse }) {
  const measurable = data.rows.filter(row => row.wanted_multiple_choice > 0);
  const unstamped = data.total_unstamped;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          When the content could not fill a grid
          <MetricInfo metric="format_fallback_rate" />
        </CardTitle>
        <CardDescription>
          Of the Conquest challenges that asked for a multiple-choice grid, the share
          that could not build a fair one and served autocomplete instead.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 overflow-x-auto">
        {data.total_wanted_multiple_choice > 0 && (
          <p className="text-sm">
            {`${data.total_fallbacks.toLocaleString()} of ${data.total_wanted_multiple_choice.toLocaleString()} challenges that wanted a grid could not build one.`}
          </p>
        )}

        {measurable.length === 0
          ? (
              <EmptyState hint={unstamped > 0 ? undefined : 'Try a wider date range.'}>
                {unstamped > 0
                  // Not "no fallbacks". Every challenge here predates the flag, and
                  // reporting that as a clean 0% is the specific wrong answer.
                  ? `No challenge in this window records its format. All ${unstamped.toLocaleString()} predate the flag, so the rate is unknown rather than zero.`
                  : 'No challenges asked for a multiple-choice grid in this window.'}
              </EmptyState>
            )
          : (
              <ReportTable>
                <ReportHead>
                  <Th>Challenge type</Th>
                  <Th align="right" title="Built a grid, plus fell back — never all challenges">Wanted a grid</Th>
                  <Th align="right">Fell back</Th>
                  <Th align="right">Rate</Th>
                </ReportHead>
                <tbody>
                  {measurable.map(row => (
                    <ReportRow key={row.challenge_type}>
                      <Td strong>{row.challenge_type.replaceAll('_', ' ').toLowerCase()}</Td>
                      <Td align="right">{row.wanted_multiple_choice.toLocaleString()}</Td>
                      <Td align="right">{row.fallbacks.toLocaleString()}</Td>
                      <Td align="right" strong>
                        {row.fallback_pct === null ? '—' : `${row.fallback_pct}%`}
                      </Td>
                    </ReportRow>
                  ))}
                </tbody>
              </ReportTable>
            )}

        {measurable.length > 0 && unstamped > 0 && (
          <p className="text-xs text-muted-foreground">
            {`${unstamped.toLocaleString()} challenges in this window predate the flag and are left out of every rate above, rather than counted as successes.`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
