'use client';

import type { LineupsAnalyticsResponse } from '@/types/reports';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { MetricInfo } from '@/components/reports/primitives/MetricInfo';
import { MetricRow } from '@/components/reports/primitives/MetricRow';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/primitives/ReportTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Which lineup slots cost the most work.
 *
 * Ranked by guesses per session rather than by solve rate, which would be a
 * column of 99s: the game lets a player keep guessing, so almost everything is
 * eventually solved and effort is the only thing that separates a slot.
 */

/** Above this many guesses a slot is worth an editor's attention. */
const NOTABLE_GUESSES = 3;

/** Below this, a slot is not being solved at all reliably. */
const LOW_SOLVE_PCT = 90;

export function LineupSlots({ data }: { data: LineupsAnalyticsResponse }) {
  const { rows, min_sessions: minSessions, slots_measured: measured } = data.slots;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Which slots take the most work
          <MetricInfo metric="guesses_per_session" />
        </CardTitle>
        <CardDescription>
          Guesses per session, not the share solved. This game lets a player keep
          guessing, so nearly everything is solved eventually — what separates a
          slot is how much work it costs to get there.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 overflow-x-auto">
        <MetricRow
          columns={3}
          metrics={[
            { label: 'Slots rated', value: measured.toLocaleString(), metric: 'guesses_per_session' },
            { label: 'Rating needs', value: `${minSessions} sessions` },
            {
              label: 'Hardest',
              value: rows[0] ? `${rows[0].guesses_per_session} guesses` : '—',
            },
          ]}
        />

        {rows.length === 0
          ? (
              <EmptyState hint="Try a wider date range.">
                No slot was played enough times to rate.
              </EmptyState>
            )
          : (
              <ReportTable>
                <ReportHead>
                  <Th>Player</Th>
                  <Th>Lineup</Th>
                  <Th align="right">Sessions</Th>
                  <Th align="right" title="Guesses made on this slot per session that reached it">Guesses each</Th>
                  <Th align="right" title="Eventually solved — near-universal by design, so read it as a floor">Solved</Th>
                  <Th align="right" title="Share of sessions where a hint was taken on this slot">Hinted</Th>
                </ReportHead>
                <tbody>
                  {rows.map(row => (
                    <ReportRow key={row.slot_id}>
                      <Td strong>
                        {row.player}
                        {row.shirt_number !== null && (
                          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                            {`#${row.shirt_number}`}
                          </span>
                        )}
                      </Td>
                      {/* The lineup, because the same footballer elsewhere is a
                          different slot — the shirt number and the positions
                          around them are what make them guessable. */}
                      <Td className="text-muted-foreground">{row.lineup}</Td>
                      <Td align="right">{row.sessions.toLocaleString()}</Td>
                      <Td
                        align="right"
                        strong
                        className={cn(
                          row.guesses_per_session !== null
                          && row.guesses_per_session >= NOTABLE_GUESSES
                          && 'text-amber-600 dark:text-amber-500',
                        )}
                      >
                        {row.guesses_per_session ?? '—'}
                      </Td>
                      <Td
                        align="right"
                        className={cn(
                          row.solve_rate_pct !== null && row.solve_rate_pct < LOW_SOLVE_PCT
                            ? 'text-amber-600 dark:text-amber-500'
                            : 'text-muted-foreground',
                        )}
                      >
                        {row.solve_rate_pct === null ? '—' : `${row.solve_rate_pct}%`}
                      </Td>
                      <Td align="right" className="text-muted-foreground">
                        {row.hint_rate_pct === null ? '—' : `${row.hint_rate_pct}%`}
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
