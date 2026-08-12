'use client';

import type { GameMetaMap } from '@/hooks/use-game-meta';
import { useGameColor } from '@/hooks/use-game-meta';
import type { DurationResponse } from '@/types/reports';
import { Info } from 'lucide-react';
import { ExportButton } from '@/components/reports/ExportButton';
import { GameBadge } from '@/components/reports/GameBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatDuration } from '@/lib/format-duration';
import { cn } from '@/lib/utils';

/**
 * Session length per game.
 *
 * Deliberately does NOT present one ranking. Conquest's median is 24 hours
 * because a session there is a day-long campaign; Team Ties' is 5 minutes
 * because a session is a sitting. Ranking them together would read as "Conquest
 * holds attention 280x better", which is not what the number means — so the two
 * shapes are split into separate tables.
 */
export function DurationTable({ data, meta }: { data: DurationResponse; meta: GameMetaMap }) {
  const resolveColor = useGameColor();
  const comparable = data.rows.filter(row => row.supported && row.single_sitting);
  const longLived = data.rows.filter(row => row.supported && row.single_sitting === false);
  const unsupported = data.rows.filter(row => !row.supported);

  const maxMedian = Math.max(...comparable.map(row => row.median_seconds ?? 0), 0);

  const renderRows = (rows: typeof data.rows, showBar: boolean) => rows.map(row => (
    <tr key={row.game_type} className="border-b last:border-0 dark:border-slate-700">
      <td className="py-2 pr-4">
        <GameBadge gameKey={row.game_type} meta={meta} />
      </td>
      <td className="py-2 pr-4">
        <div className="flex items-center gap-2">
          <span className="w-14 text-right font-medium tabular-nums text-gray-900 dark:text-white">
            {formatDuration(row.median_seconds)}
          </span>
          {showBar && (
            <div className="h-1.5 w-full max-w-32 overflow-hidden rounded-full bg-gray-100 dark:bg-slate-700">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${maxMedian > 0 ? Math.max(2, ((row.median_seconds ?? 0) / maxMedian) * 100) : 0}%`,
                  backgroundColor: resolveColor(meta, row.game_type),
                }}
              />
            </div>
          )}
        </div>
      </td>
      <td className="py-2 pr-4 text-right tabular-nums">{formatDuration(row.p90_seconds)}</td>
      <td className="py-2 pr-4 text-right tabular-nums">{row.measured.toLocaleString()}</td>
      <td className="py-2 text-right">
        <span className={cn(
          'tabular-nums',
          (row.coverage_pct ?? 100) < 90 ? 'text-amber-700 dark:text-amber-300' : '',
        )}
        >
          {row.coverage_pct === null ? '—' : `${row.coverage_pct}%`}
        </span>
      </td>
    </tr>
  ));

  const head = (
    <thead>
      <tr className="border-b text-left text-gray-600 dark:border-slate-700 dark:text-gray-300">
        <th className="py-2 pr-4 font-medium">Game</th>
        <th className="py-2 pr-4 font-medium">Median</th>
        <th className="py-2 pr-4 text-right font-medium">p90</th>
        <th className="py-2 pr-4 text-right font-medium">Sessions</th>
        <th className="py-2 text-right font-medium">Coverage</th>
      </tr>
    </thead>
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
                  <strong>{meta[data.longest_single_sitting_game]?.label ?? data.longest_single_sitting_game}</strong>
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
              { header: 'Median seconds', value: row => row.median_seconds },
              { header: 'p90 seconds', value: row => row.p90_seconds },
              { header: 'Sessions measured', value: row => row.measured },
              { header: 'Finished sessions', value: row => row.sessions },
              { header: 'Coverage %', value: row => row.coverage_pct },
              { header: 'Long sessions', value: row => row.long_sessions },
              { header: 'Long sessions %', value: row => row.long_sessions_pct },
              { header: 'Single sitting', value: row => (row.single_sitting === null ? null : String(row.single_sitting)) },
            ]}
          />
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            {head}
            <tbody>{renderRows(comparable, true)}</tbody>
          </table>
          {comparable.length === 0 && (
            <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No comparable games in this range.
            </p>
          )}
        </CardContent>
      </Card>

      {longLived.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Long-lived sessions</CardTitle>
            <CardDescription className="flex items-start gap-2">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              <span>
                A session in these games spans a day or more by design, so their length
                isn't comparable with per-round games — listed separately rather than
                ranked alongside them, where they'd win by definition.
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              {head}
              <tbody>{renderRows(longLived, false)}</tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {unsupported.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          No session length available for
          {' '}
          {unsupported.map(row => meta[row.game_type]?.label ?? row.game_type).join(' and ')}
          {' — '}
          {unsupported[0]?.reason}
          .
        </p>
      )}
    </div>
  );
}
