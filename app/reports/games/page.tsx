'use client';

import type { RangeState } from '@/lib/report-range';
import type { GameRowWithDuration, GameSortKey } from '@/lib/report-sort';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DurationHistogram } from '@/components/reports/charts/DurationHistogram';
import { FavouredVsPlayedChart } from '@/components/reports/favourites/FavouredVsPlayedChart';
import { FilterBar } from '@/components/reports/filters/FilterBar';
import { RangePicker } from '@/components/reports/filters/RangePicker';
import { AbandonedPanel } from '@/components/reports/panels/AbandonedPanel';
import { DurationTable } from '@/components/reports/panels/DurationTable';
import { UnfinishedTable } from '@/components/reports/panels/UnfinishedTable';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { ExportButton } from '@/components/reports/primitives/ExportButton';
import { GameBadge } from '@/components/reports/primitives/GameBadge';
import { MetricInfo } from '@/components/reports/primitives/MetricInfo';
import { ReportPanel } from '@/components/reports/primitives/ReportPanel';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/primitives/ReportTable';
import { ReportsShell } from '@/components/reports/shell/ReportsShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFavouredVsPlayed } from '@/hooks/use-favoured-vs-played';
import { useGameMeta } from '@/hooks/use-game-meta';
import { useReport } from '@/hooks/use-report';
import { useReportFilters } from '@/hooks/use-report-filters';
import { useAuth } from '@/lib/auth';
import { formatDuration } from '@/lib/format-duration';
import { rangeToParams } from '@/lib/report-range';
import { sortGameTotals } from '@/lib/report-sort';
import { ReportsAPI } from '@/lib/reports-api';

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
  // A snapshot, so it takes no range — see UnfinishedTable. It sits under a
  // ranged page because the question ("what is lying around for this game") is a
  // per-game one; the panel says so itself rather than inheriting the filter.
  const unfinishedParams = useMemo(() => ({ include_bots: includeBots }), [includeBots]);
  const unfinished = useReport(
    () => ReportsAPI.getUnfinished(includeBots),
    unfinishedParams,
    enabled,
    'The unfinished-sessions endpoint',
  );
  const favourites = useFavouredVsPlayed(enabled);
  const state = useReport(
    ReportsAPI.getSummary,
    params,
    enabled,
    'The reporting summary endpoint',
  );

  const rows = useMemo(() => {
    if (!state.data) {
      return [];
    }
    const byGame = new Map((duration.data?.rows ?? []).map(row => [row.game_type, row]));
    const merged: GameRowWithDuration[] = state.data.by_game.map(row => ({
      ...row,
      median_seconds: byGame.get(row.game_type)?.median_seconds ?? null,
      single_sitting: byGame.get(row.game_type)?.single_sitting ?? null,
    }));
    // The shared helper rather than a local copy: the null rule it encodes —
    // unmeasured sorts last, never as a low value — is the part that is easy to
    // get wrong, and it is tested in one place.
    return sortGameTotals(merged, sortBy);
  }, [state.data, duration.data, sortBy]);

  return (
    <ReportsShell
      title="Games"
      description="Every game side by side. Click one for its own report."
    >
      <FilterBar>
        <RangePicker
          value={range}
          onChange={setRange}
          includeBots={includeBots}
          onIncludeBotsChange={setIncludeBots}
        />

      </FilterBar>
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

      <ReportPanel state={state} skeletonClassName="h-96 w-full">
        {data => (
          <>
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
                <ReportTable>
                  <ReportHead>
                    <Th>Game</Th>
                    {COLUMNS.map(column => (
                      <Th key={column.key} align="right">
                        <button
                          type="button"
                          title={column.hint}
                          onClick={() => setSortBy(column.key)}
                          className={sortBy === column.key
                            ? 'font-semibold text-emerald-700 dark:text-emerald-400'
                            : 'hover:text-foreground dark:hover:text-white'}
                        >
                          {column.label}
                        </button>
                        <MetricInfo metric={column.metric} />
                      </Th>
                    ))}
                  </ReportHead>
                  <tbody>
                    {rows.map((row: GameRowWithDuration) => (
                      <ReportRow key={row.game_type}>
                        <Td>
                          <GameBadge
                            gameKey={row.game_type}
                            meta={meta}
                            href={`/reports/games/${row.game_type}`}
                          />
                        </Td>
                        <Td align="right" strong>
                          {row.games_started.toLocaleString()}
                        </Td>
                        <Td align="right">{num(row.completion_pct, '%')}</Td>
                        <Td align="right">{num(row.sessions_per_player)}</Td>
                        <Td align="right">{num(row.repeat_rate_pct, '%')}</Td>
                        <Td align="right">
                          {row.median_seconds === null || row.median_seconds === undefined
                            ? <span className="text-muted-foreground/70">—</span>
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
                        </Td>
                        <Td align="right">
                          {row.trend_pct === null
                            ? <span className="text-muted-foreground/70">—</span>
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
                        </Td>
                      </ReportRow>
                    ))}
                  </tbody>
                </ReportTable>
                {rows.length === 0 && (
                  <EmptyState>
                    No game activity in this window.
                  </EmptyState>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </ReportPanel>

      {/* Session length lived on its own page, which split one question in two:
          the table above already carries a "Typical session" column from this
          same request, so a reader comparing games had the ranking here and the
          shape of it somewhere else. Its own panel, because the duration request
          can fail or lag independently of the games one. */}
      {/* Folded in from their own destinations (#1474 R4). Both answer per-game
          questions and neither earned a nav entry: the unfinished pool is 93%
          older than a week and static, and four favourites charts were more
          surface than the feature has earned. Separate panels, so one slow
          request cannot blank the table above. */}
      <ReportPanel state={unfinished} skeletonClassName="h-64 w-full">
        {data => (
          <UnfinishedTable
            rows={data.rows}
            meta={meta}
            asOf={data.as_of}
            totalStale={data.total_stale_sessions}
          />
        )}
      </ReportPanel>

      {favourites.data && !favourites.error && (
        <FavouredVsPlayedChart
          data={favourites.data}
          isLoading={favourites.isLoading}
          error={favourites.error}
          notDeployed={favourites.notDeployed}
          meta={meta}
          onRetry={favourites.refetch}
        />
      )}

      <ReportPanel state={duration} skeletonClassName="h-80 w-full">
        {data => (
          <>
            <DurationTable data={data} meta={meta} />
            {/* After the comparison, because "which game holds attention" comes
                before "what does this one look like". */}
            <DurationHistogram data={data} meta={meta} />
          </>
        )}
      </ReportPanel>
    </ReportsShell>
  );
}
