'use client';

import type { GridAnalyticsResponse, GridModeRow, GridVariationRow } from '@/types/reports';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { MetricInfo } from '@/components/reports/primitives/MetricInfo';
import { MetricRow } from '@/components/reports/primitives/MetricRow';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/primitives/ReportTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * How each Grid mode and variation actually plays.
 *
 * A mode bucket is difficulty × roster × size — the exact thing an admin
 * composes in the Grid admin. A freshly composed mode shows up here the day
 * people start playing it, which is how it gets judged before anyone
 * complains: low completion or a wrong-guess pile in one bucket is a
 * composition problem, not a player problem.
 */

/** Below this, completion is worth a look whatever the mode promises. */
const LOW_COMPLETION_PCT = 60;

function modeLabel(row: GridModeRow): string {
  const difficulty = row.difficulty === 'EASY'
    ? 'Standard'
    : row.difficulty === 'HARD'
      ? 'Hard'
      : row.difficulty ?? 'Unclassified';
  const roster = row.footballer_status === 'ACTIVE'
    ? ' · Active'
    : row.footballer_status === 'NOT_ACTIVE'
      ? ' · Retired'
      : '';
  return `${difficulty}${roster} · ${row.grid_size}`;
}

function OutcomeCells({ row }: { row: GridModeRow | GridVariationRow }) {
  return (
    <>
      <Td align="right">{row.sessions.toLocaleString()}</Td>
      <Td align="right">{row.finished.toLocaleString()}</Td>
      <Td
        align="right"
        strong
        className={cn(
          row.completion_pct < LOW_COMPLETION_PCT && row.sessions >= 30
          && 'text-amber-600 dark:text-amber-500',
        )}
      >
        {`${row.completion_pct}%`}
      </Td>
      <Td align="right">
        {`${row.perfect_pct}%`}
        <span className="ml-1 text-xs text-muted-foreground">{`(${row.perfect.toLocaleString()})`}</span>
      </Td>
      <Td align="right">{row.avg_score ?? '—'}</Td>
    </>
  );
}

export function GridModes({ data }: { data: GridAnalyticsResponse }) {
  const totalSessions = data.modes.reduce((sum, row) => sum + row.sessions, 0);
  const totalFinished = data.modes.reduce((sum, row) => sum + row.finished, 0);
  const totalPerfect = data.modes.reduce((sum, row) => sum + row.perfect, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Modes and variations
          <MetricInfo metric="grid_perfect_pct" />
        </CardTitle>
        <CardDescription>
          Every difficulty × roster × size bucket that was played, and every
          variation. A new mode appears here the day it gets its first player —
          judge it on completion and errors before anyone has to complain.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 overflow-x-auto">
        <MetricRow
          columns={3}
          metrics={[
            { label: 'Sessions', value: totalSessions.toLocaleString() },
            {
              label: 'Completion',
              value: totalSessions === 0 ? '—' : `${Math.round((totalFinished / totalSessions) * 100)}%`,
            },
            {
              label: 'Perfect grids',
              value: totalPerfect.toLocaleString(),
              metric: 'grid_perfect_pct',
            },
          ]}
        />

        {data.modes.length === 0
          ? (
              <EmptyState hint="Try a wider date range.">
                No Grid session in this window.
              </EmptyState>
            )
          : (
              <ReportTable>
                <ReportHead>
                  <Th>Mode</Th>
                  <Th align="right">Sessions</Th>
                  <Th align="right">Finished</Th>
                  <Th align="right" title="Finished as a share of started">Completion</Th>
                  <Th align="right" title="Every cell correct, as a share of finished">Perfect</Th>
                  <Th align="right" title="Average score of finished sessions">Avg score</Th>
                  <Th align="right" title="Player-made wrong placements (Extra-Time excluded)">Wrong guesses</Th>
                </ReportHead>
                <tbody>
                  {data.modes.map(row => (
                    <ReportRow key={`${row.difficulty}-${row.footballer_status}-${row.grid_size}`}>
                      <Td strong>{modeLabel(row)}</Td>
                      <OutcomeCells row={row} />
                      <Td align="right" className="text-muted-foreground">
                        {row.wrong_guesses.toLocaleString()}
                      </Td>
                    </ReportRow>
                  ))}
                </tbody>
              </ReportTable>
            )}

        {data.variations.length > 0 && (
          <ReportTable>
            <ReportHead>
              <Th>Variation</Th>
              <Th align="right">Sessions</Th>
              <Th align="right">Finished</Th>
              <Th align="right">Completion</Th>
              <Th align="right">Perfect</Th>
              <Th align="right">Avg score</Th>
            </ReportHead>
            <tbody>
              {data.variations.map(row => (
                <ReportRow key={row.variation_id ?? 'default'}>
                  <Td strong>{row.variation}</Td>
                  <OutcomeCells row={row} />
                </ReportRow>
              ))}
            </tbody>
          </ReportTable>
        )}
      </CardContent>
    </Card>
  );
}
