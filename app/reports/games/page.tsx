'use client';

import type { RangeState } from '@/lib/report-range';
import type { GameSortKey } from '@/lib/report-sort';
import type { GameTotals } from '@/types/reports';
import { ArrowDown, ArrowUp } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { GameBadge } from '@/components/reports/GameBadge';
import { MetricInfo } from '@/components/reports/MetricInfo';
import { ExportButton } from '@/components/reports/ExportButton';
import { RangePicker } from '@/components/reports/RangePicker';
import { ReportError } from '@/components/reports/ReportError';
import { ReportsShell } from '@/components/reports/ReportsShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGameMeta } from '@/hooks/use-game-meta';
import { useReport } from '@/hooks/use-report';
import { useReportFilters } from '@/hooks/use-report-filters';
import { useAuth } from '@/lib/auth';
import { rangeToParams } from '@/lib/report-range';
import { ReportsAPI } from '@/lib/reports-api';

/** `metric` keys into the BE glossary so the column explains itself. */
const COLUMNS: { key: GameSortKey; label: string; hint: string; metric: string }[] = [
  { key: 'games_started', label: 'Played', hint: 'Sessions started in the window', metric: 'games_started' },
  { key: 'completion_pct', label: 'Finished', hint: 'Share of started sessions that were completed', metric: 'completion_pct' },
  { key: 'sessions_per_player', label: 'Per player', hint: 'Sessions per distinct player — depth of engagement', metric: 'sessions_per_player' },
  { key: 'repeat_rate_pct', label: 'Came back', hint: 'Share of players who returned on another day', metric: 'repeat_rate_pct' },
  { key: 'trend_pct', label: 'Trend', hint: 'vs the immediately preceding window of equal length', metric: 'trend_pct' },
];

/**
 * Null means "not measurable", never zero — a game nobody played has no
 *  completion rate, and rendering 0% would read as "everyone abandoned it".
 */
function num(value: number | null, suffix = '') {
  return value === null ? '—' : `${value.toLocaleString()}${suffix}`;
}

export default function GamesIndexPage() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);

  // Filters live in the URL so a view can be bookmarked, shared or reloaded
  // without losing what was selected.
  const { filters, update } = useReportFilters({
    range: { window: 30 },
    includeBots: false,
    game: null,
    metric: 'games_started',
  });
  const { range, includeBots, game } = filters;
  const setRange = (next: RangeState) => update({ range: next });
  const setIncludeBots = (next: boolean) => update({ includeBots: next });
  const [sortBy, setSortBy] = useState<GameSortKey>('games_started');

  const params = useMemo(
    () => ({ ...rangeToParams(range), include_bots: includeBots }),
    [range, includeBots],
  );

  const { meta } = useGameMeta(enabled);
  const { data, isLoading, error, notDeployed, refetch } = useReport(
    ReportsAPI.getSummary,
    params,
    enabled,
    'The reporting summary endpoint',
  );

  const rows = useMemo(() => {
    if (!data) {
      return [];
    }
    // Nulls sort last regardless of direction: a game with no measurable rate
    // isn't "worst", it's unmeasured, and floating it to either end of a
    // ranking makes a claim the data doesn't support.
    return [...data.by_game].sort((a, b) => {
      const left = a[sortBy];
      const right = b[sortBy];
      if (left === null && right === null) {
        return 0;
      }
      if (left === null) {
        return 1;
      }
      if (right === null) {
        return -1;
      }
      return right - left;
    });
  }, [data, sortBy]);

  return (
    <ReportsShell
      title="Games"
      description="Every game side by side. Click one for its own report."
    >
      <RangePicker
        value={range}
        onChange={setRange}
        includeBots={includeBots}
        onIncludeBotsChange={setIncludeBots}
      />

      <div className="flex justify-end">
        <ExportButton
          rows={rows}
          view="games"
          filters={{ ...rangeToParams(range), bots: includeBots, game }}
          columns={[
                    { header: 'Game', value: row => row.game_type },
                    { header: 'Played', value: row => row.games_started },
                    { header: 'Finished', value: row => row.games_finished },
                    { header: 'Completion %', value: row => row.completion_pct },
                    { header: 'Sessions per player', value: row => row.sessions_per_player },
                    { header: 'Came back %', value: row => row.repeat_rate_pct },
                    { header: 'Trend %', value: row => row.trend_pct },
                  ]}
        />
      </div>

      {error
        ? <ReportError error={error} notDeployed={notDeployed} onRetry={refetch} />
        : isLoading || !data
          ? <Skeleton className="h-96 w-full" />
          : (
              <Card>
                <CardHeader>
                  <CardTitle>Comparison</CardTitle>
                  <CardDescription>
                    Sorted by
                    {' '}
                    {COLUMNS.find(column => column.key === sortBy)?.label.toLowerCase()}
                    . Games with nothing to measure sort last rather than bottom —
                    unmeasured is not the same as worst.
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-600 dark:border-slate-700 dark:text-gray-300">
                        <th className="py-2 pr-4 font-medium">Game</th>
                        {COLUMNS.map(column => (
                          <th key={column.key} className="py-2 pr-4 text-right font-medium">
                            <button
                              type="button"
                              title={column.hint}
                              onClick={() => setSortBy(column.key)}
                              className={sortBy === column.key
                                ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                                : 'hover:text-gray-900 dark:hover:text-white'}
                            >
                              {column.label}
                            </button>
                            <MetricInfo metric={column.metric} />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row: GameTotals) => (
                        <tr key={row.game_type} className="border-b last:border-0 dark:border-slate-700">
                          <td className="py-2 pr-4">
                            <Link href={`/reports/games/${row.game_type}`}>
                              <GameBadge gameKey={row.game_type} meta={meta} />
                            </Link>
                          </td>
                          <td className="py-2 pr-4 text-right font-medium text-gray-900 dark:text-white">
                            {row.games_started.toLocaleString()}
                          </td>
                          <td className="py-2 pr-4 text-right">{num(row.completion_pct, '%')}</td>
                          <td className="py-2 pr-4 text-right">{num(row.sessions_per_player)}</td>
                          <td className="py-2 pr-4 text-right">{num(row.repeat_rate_pct, '%')}</td>
                          <td className="py-2 pr-4 text-right">
                            {row.trend_pct === null
                              ? <span className="text-gray-400">—</span>
                              : (
                                  <span className={row.trend_pct >= 0
                                    ? 'inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400'
                                    : 'inline-flex items-center gap-1 text-red-600 dark:text-red-400'}
                                  >
                                    {row.trend_pct >= 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
                                    {Math.abs(row.trend_pct).toLocaleString()}
                                    %
                                  </span>
                                )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length === 0 && (
                    <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                      No game activity in this window.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
    </ReportsShell>
  );
}
