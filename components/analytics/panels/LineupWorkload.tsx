'use client';

import type { LineupsAnalyticsResponse } from '@/types/reports';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/primitives/ReportTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Whole lineups, by the work they ask for.
 *
 * A lineup that costs 25 guesses a session is not automatically bad — it may be
 * eleven obscure players on purpose. It is the one to look at when completion
 * drops, which is why the two sit in the same row.
 */
export function LineupWorkload({ data }: { data: LineupsAnalyticsResponse }) {
  const { rows, min_sessions: minSessions, lineups_measured: measured } = data.lineups;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lineups by the work they ask for</CardTitle>
        <CardDescription>
          {`${measured.toLocaleString()} lineups played at least ${minSessions} times. Read the two columns together — a demanding lineup is only a problem when people stop finishing it.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {rows.length === 0
          ? (
              <EmptyState hint="Try a wider date range.">
                No lineup was played enough times to rate.
              </EmptyState>
            )
          : (
              <ReportTable>
                <ReportHead>
                  <Th>Lineup</Th>
                  <Th align="right">Sessions</Th>
                  <Th align="right" title="Guesses across the whole lineup, per session">Guesses each</Th>
                  <Th align="right">Finished</Th>
                </ReportHead>
                <tbody>
                  {rows.map(row => (
                    <ReportRow key={row.lineup_id}>
                      <Td strong>{row.title}</Td>
                      <Td align="right">{row.sessions.toLocaleString()}</Td>
                      <Td align="right" strong>{row.guesses_per_session ?? '—'}</Td>
                      <Td align="right" className="text-muted-foreground">
                        {row.finished_pct === null ? '—' : `${row.finished_pct}%`}
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
