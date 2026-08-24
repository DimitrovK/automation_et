'use client';

import type { GameMetaMap } from '@/hooks/use-game-meta';
import type { DurationResponse } from '@/types/reports';
import { Info } from 'lucide-react';
import { DurationSpread } from '@/components/reports/charts/DurationSpread';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { ExportButton } from '@/components/reports/primitives/ExportButton';
import { GameBadge } from '@/components/reports/primitives/GameBadge';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/primitives/ReportTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { gameName, useGameColor } from '@/hooks/use-game-meta';
import { formatDuration } from '@/lib/format-duration';
import { longSessionReason } from '@/lib/long-session-reason';
import { cn } from '@/lib/utils';

/**
 * Session length per game.
 *
 * Deliberately does NOT present one ranking. Conquest's median is 24 hours and
 * Team Ties' is 5 minutes; ranking them together would read as "Conquest holds
 * attention 280x better", which is not what the number means — so the two
 * shapes are split into separate tables.
 *
 * The second table used to explain itself once, for everyone: these games "span
 * a day or more by design". That is true of a campaign game and false of
 * Conquest, whose 24 hours is its idle sweeper closing abandoned sessions —
 * housekeeping, quoted as attention. So the reason is now per row, and each one
 * carries the median among sessions that actually played out.
 */
export function DurationTable({ data, meta }: { data: DurationResponse; meta: GameMetaMap }) {
  const resolveColor = useGameColor();
  const comparable = data.rows.filter(row => row.supported && row.single_sitting);
  const longLived = data.rows.filter(row => row.supported && row.single_sitting === false);
  const unsupported = data.rows.filter(row => !row.supported);

  const maxMedian = Math.max(...comparable.map(row => row.median_seconds ?? 0), 0);

  const renderRows = (rows: typeof data.rows) => rows.map(row => (
    <ReportRow key={row.game_type}>
      <Td>
        <GameBadge gameKey={row.game_type} meta={meta} href={`/reports/games/${row.game_type}`} />
      </Td>
      <Td>
        <div className="flex items-center gap-2">
          <span className="w-14 text-right font-medium text-foreground tabular-nums">
            {formatDuration(row.median_seconds)}
          </span>
          <div className="h-1.5 w-full max-w-32 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${maxMedian > 0 ? Math.max(2, ((row.median_seconds ?? 0) / maxMedian) * 100) : 0}%`,
                backgroundColor: resolveColor(meta, row.game_type),
              }}
            />
          </div>
        </div>
      </Td>
      {/* Where the middle half of sessions actually sit. The median beside it
          is one number, and two games with the same median can be a tight
          five-minute game and a sprawl. */}
      <Td><DurationSpread row={row} /></Td>
      <Td align="right">{formatDuration(row.p90_seconds)}</Td>
      <Td align="right">{row.measured.toLocaleString()}</Td>
      <Td align="right">
        <span className={cn(
          'tabular-nums',
          (row.coverage_pct ?? 100) < 90 ? 'text-amber-700 dark:text-amber-300' : '',
        )}
        >
          {row.coverage_pct === null ? '—' : `${row.coverage_pct}%`}
        </span>
      </Td>
    </ReportRow>
  ));

  const longLivedHead = (
    <ReportHead>
      <Th>Game</Th>
      <Th>Median</Th>
      <Th>Why it's long</Th>
      <Th align="right">Played out</Th>
      <Th align="right">Sessions</Th>
    </ReportHead>
  );

  const renderLongLived = (rows: typeof data.rows) => rows.map((row) => {
    const why = longSessionReason(row);
    return (
      <ReportRow key={row.game_type} className="align-top">
        <Td>
          <GameBadge gameKey={row.game_type} meta={meta} href={`/reports/games/${row.game_type}`} />
        </Td>
        <Td strong>
          {formatDuration(row.median_seconds)}
        </Td>
        <Td className="max-w-md">
          {why === null
            ? <span className="text-muted-foreground">—</span>
            : (
                <>
                  <span className="font-medium text-foreground">{why.label}</span>
                  <p className="text-xs text-muted-foreground">{why.detail}</p>
                </>
              )}
        </Td>
        {/* The comparable number, where the headline one isn't: a swept game's
            median is the sweeper's clock, and this is the median among the
            sessions that actually played out. */}
        <Td align="right" strong>
          {why?.playedOut ?? '—'}
        </Td>
        <Td align="right">{row.measured.toLocaleString()}</Td>
      </ReportRow>
    );
  });

  const head = (
    <ReportHead>
      <Th>Game</Th>
      <Th>Median</Th>
      <Th title="Where the middle half of sessions sit — p25 to p75, median marked">Middle half</Th>
      <Th align="right">p90</Th>
      <Th align="right">Sessions</Th>
      <Th align="right">Coverage</Th>
    </ReportHead>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle>How long a session lasts</CardTitle>
            <CardDescription>
              Median, not mean — the long tail is abandoned sessions, not slow players.
              {data.longest_single_sitting_game && (
                <>
                  {' Longest single sitting: '}
                  <strong>{gameName(meta[data.longest_single_sitting_game], data.longest_single_sitting_game)}</strong>
                  .
                </>
              )}
            </CardDescription>
          </div>
          <ExportButton
            view="duration"
            rows={data.rows}
            filters={{ start: data.start, end: data.end }}
            columns={[
              { header: 'Game', value: row => row.game_type },
              { header: 'p25 seconds', value: row => row.p25_seconds ?? '' },
              { header: 'Median seconds', value: row => row.median_seconds },
              { header: 'p75 seconds', value: row => row.p75_seconds ?? '' },
              { header: 'p90 seconds', value: row => row.p90_seconds },
              { header: 'Sessions measured', value: row => row.measured },
              { header: 'Finished sessions', value: row => row.sessions },
              { header: 'Coverage %', value: row => row.coverage_pct },
              { header: 'Long sessions', value: row => row.long_sessions },
              { header: 'Long sessions %', value: row => row.long_sessions_pct },
              { header: 'Single sitting', value: row => (row.single_sitting === null ? null : String(row.single_sitting)) },
              { header: 'Why long', value: row => row.long_reason ?? '' },
              { header: 'Idle sweep after seconds', value: row => row.idle_finish_seconds ?? '' },
              { header: 'Swept sessions', value: row => row.swept_sessions ?? '' },
              { header: 'Swept %', value: row => row.swept_pct ?? '' },
              { header: 'Median excluding swept seconds', value: row => row.median_excluding_swept_seconds ?? '' },
            ]}
          />
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <ReportTable>
            {head}
            <tbody>{renderRows(comparable)}</tbody>
          </ReportTable>
          {comparable.length === 0 && (
            <EmptyState>
              No comparable games in this range.
            </EmptyState>
          )}
        </CardContent>
      </Card>

      {longLived.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Long-lived sessions</CardTitle>
            <CardDescription className="flex items-start gap-2">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              <span>
                Sessions here run past
                {' '}
                {formatDuration(data.long_session_seconds)}
                , so they aren't comparable with per-round games and are listed apart
                rather than ranked alongside them, where they'd win by definition.
                Long for two different reasons, though — played that way, or closed by
                a timeout — so each row says which.
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <ReportTable>
              {longLivedHead}
              <tbody>{renderLongLived(longLived)}</tbody>
            </ReportTable>
          </CardContent>
        </Card>
      )}

      {unsupported.length > 0 && (
        <p className="text-xs text-muted-foreground">
          No session length available for
          {' '}
          {unsupported.map(row => gameName(meta[row.game_type], row.game_type)).join(' and ')}
          {' — '}
          {unsupported[0]?.reason}
          .
        </p>
      )}
    </div>
  );
}
