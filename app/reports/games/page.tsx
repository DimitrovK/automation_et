'use client';

import type { RangeState } from '@/lib/report-range';
import type { GameRowWithDuration, GameSortKey } from '@/lib/report-sort';
import { ArrowDown, ArrowUp } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { GameBadge } from '@/components/reports/GameBadge';
import { MetricInfo } from '@/components/reports/MetricInfo';
import { ExportButton } from '@/components/reports/ExportButton';
import { RangePicker } from '@/components/reports/RangePicker';
import { AbandonedPanel } from '@/components/reports/AbandonedPanel';
import { ReachDepthChart } from '@/components/reports/ReachDepthChart';
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
import { formatDuration } from '@/lib/format-duration';
import { sortGameTotals } from '@/lib/report-sort';

/** `metric` keys into the BE glossary so the column explains itself. */
const COLUMNS: { key: GameSortKey; label: string; hint: string; metric: string }[] = [
  { key: 'games_started', label: 'Played', hint: 'Sessions started in the window', metric: 'games_started' },
  { key: 'completion_pct', label: 'Finished', hint: 'Share of started sessions that were completed', metric: 'completion_pct' },
  { key: 'sessions_per_player', label: 'Per player', hint: 'Sessions per distinct player — depth of engagement', metric: 'sessions_per_player' },
  { key: 'repeat_rate_pct', label: 'Came back', hint: 'Share of players who returned on another day', metric: 'repeat_rate_pct' },
  { key: 'trend_pct', label: 'Trend', hint: 'vs the immediately preceding window of equal length', metric: 'trend_pct' },
  { key: 'median_seconds', label: 'Typical session', hint: 'Median session length. Campaign-shaped games are marked — their sessions span days, not sittings', metric: 'median_duration' },
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
  // Session length is a per-game property but lives on another endpoint, so the
  // comparison table had to be read beside a second page to answer "which game
  // holds attention". Merged in here instead.
  const duration = useReport(ReportsAPI.getDuration, params, enabled, 'The session duration endpoint');
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
    const byGame = new Map((duration.data?.rows ?? []).map(row => [row.game_type, row]));
    const merged: GameRowWithDuration[] = data.by_game.map(row => ({
      ...row,
      median_seconds: byGame.get(row.game_type)?.median_seconds ?? null,
      single_sitting: byGame.get(row.game_type)?.single_sitting ?? null,
    }));
    // The shared helper rather than a local copy: the null rule it encodes —
    // unmeasured sorts last, never as a low value — is the part that is easy to
    // get wrong, and it is tested in one place.
    return sortGameTotals(merged, sortBy);
  }, [data, duration.data, sortBy]);

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
            <>
              {/* Before the table, because it answers a question the table
                  can't: a ranking by volume puts a game with a wide shallow
                  audience next to one with a small devoted one and says
                  nothing about the difference. */}
              <ReachDepthChart rows={data.by_game} meta={meta} />
              {/* Reach and depth say which games are worth attention; this says
                  where the recoverable sessions actually are, which is a
                  different question and the one nobody could answer from a
                  completion-rate column. */}
              <AbandonedPanel rows={data.by_game} meta={meta} />
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
                      {rows.map((row: GameRowWithDuration) => (
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
                            {row.median_seconds === null || row.median_seconds === undefined
                              ? <span className="text-gray-400">—</span>
                              : (
                                  <span
                                    className={row.single_sitting === false ? 'text-amber-700 dark:text-amber-300' : undefined}
                                    title={row.single_sitting === false
                                      ? 'A session here spans days, not a sitting — not comparable with the others'
                                      : undefined}
                                  >
                                    {formatDuration(row.median_seconds)}
                                    {row.single_sitting === false && ' *'}
                                  </span>
                                )}
                          </td>
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
            </>
            )}
    </ReportsShell>
  );
}
