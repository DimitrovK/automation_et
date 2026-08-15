'use client';

import type { GameTotals, Granularity } from '@/types/reports';
import { useMemo, useState } from 'react';
import { ActivityChart } from '@/components/reports/ActivityChart';
import { ExportButton } from '@/components/reports/ExportButton';
import { FilterBar } from '@/components/reports/FilterBar';
import { GameBadge } from '@/components/reports/GameBadge';
import { GameLeaderboard } from '@/components/reports/GameLeaderboard';
import { MetricToggle } from '@/components/reports/MetricToggle';
import { NewVsReturning } from '@/components/reports/NewVsReturning';
import { PulseTiles } from '@/components/reports/PulseTiles';
import { RangePicker } from '@/components/reports/RangePicker';
import { ReportPanel } from '@/components/reports/ReportPanel';
import { ReportsShell } from '@/components/reports/ReportsShell';
import { RollupHealthBanner } from '@/components/reports/RollupHealthBanner';
import { useGameColor, useGameMeta } from '@/hooks/use-game-meta';
import { useReport } from '@/hooks/use-report';
import { useReportFilters } from '@/hooks/use-report-filters';
import { useAuth } from '@/lib/auth';
import { rangeToParams } from '@/lib/report-range';
import { ReportsAPI } from '@/lib/reports-api';

export default function ReportsPage() {
  // Server-side bucketing: a week's distinct players is computed, not
  // summed, so changing this refetches rather than regrouping.
  const [granularity, setGranularity] = useState<Granularity>('day');
  const resolveColor = useGameColor();
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);

  // Filters live in the URL so a view can be bookmarked or shared.
  const { filters, update } = useReportFilters({
    range: { window: 30 },
    includeBots: false,
    game: null,
    metric: 'games_started',
  });
  const { range, includeBots, metric, game } = filters;

  // The selected game narrows the pulse, the chart and the tiles together, so
  // the whole page answers "how is THIS game doing" in one click.
  const params = useMemo(
    () => ({ ...rangeToParams(range), include_bots: includeBots, ...(game ? { game_type: game } : {}) }),
    [range, includeBots, game],
  );
  // The leaderboard must always show every game, otherwise selecting one would
  // hide the row you'd click to unselect it.
  const allGamesParams = useMemo(
    () => ({ ...rangeToParams(range), include_bots: includeBots }),
    [range, includeBots],
  );

  // Granularity belongs only to the activity request. Folding it into `params`
  // would refetch the summary every time the chart regrouped, for a parameter
  // that endpoint doesn't have.
  const activityParams = useMemo(() => ({ ...params, granularity }), [params, granularity]);

  const { meta } = useGameMeta(enabled);
  const summary = useReport(ReportsAPI.getSummary, params, enabled, 'The reporting summary endpoint');
  const allGames = useReport(ReportsAPI.getSummary, allGamesParams, enabled, 'The reporting summary endpoint');
  const activity = useReport(ReportsAPI.getActivity, activityParams, enabled, 'The reporting activity endpoint');
  // Only for the new-vs-returning panel, lifted here when the Patterns page was
  // removed. Its own panel, so a slow patterns request cannot blank the pulse.
  const patterns = useReport(ReportsAPI.getPatterns, params, enabled, 'The patterns reporting endpoint');
  // Unfiltered on purpose: "what needs attention" must surface a game you
  // haven't selected, which is exactly the one you'd otherwise miss.

  const selectedLabel = game ? (meta[game]?.label ?? game) : null;

  return (
    <ReportsShell
      title="Daily Pulse"
      description="How today is going, measured against a typical day of the same weekday."
    >
      <FilterBar>
        <RangePicker
          value={range}
          onChange={next => update({ range: next })}
          includeBots={includeBots}
          onIncludeBotsChange={value => update({ includeBots: value })}
        />
        <MetricToggle value={metric} onChange={next => update({ metric: next })} />
      </FilterBar>

      {game && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-900/20">
          <span className="text-sm text-foreground/80">Filtered to</span>
          <GameBadge gameKey={game} meta={meta} active onClick={() => update({ game: null })} />
        </div>
      )}

      {/* First on the page: if the rollup is incomplete, every number below
          inherits that doubt — a quiet day and an uncomputed one look the
          same. */}
      <RollupHealthBanner />

      <ReportPanel state={summary} skeletonClassName="h-32 w-full">
        {data => (
          <>
            {/* The pulse always describes TODAY, whatever range is selected —
                    the BE sends pulse_applies to say so. Rendering it beside
                    comparison tiles that DO follow the range invites reading
                    today's numbers as the selected period's. */}
            {data.pulse_applies
              ? (
                  <>
                    <PulseTiles pulse={data.pulse} />
                    <p className="text-center text-xs text-muted-foreground">
                      {selectedLabel ? `${selectedLabel} · ` : ''}
                      compared with the mean of the last
                      {' '}
                      {data.pulse.baseline_weeks}
                      {' '}
                      {data.pulse.weekday}
                      s — not with yesterday, which would make every Monday look like a crash.
                    </p>
                  </>
                )
              : (
                  <p className="rounded-md border border-border bg-muted/50 p-3 text-center text-sm text-muted-foreground">
                    Today's pulse is hidden because this range ends on
                    {' '}
                    {data.end}
                    . It only ever describes today, so showing it here would
                    read as the selected period. Everything below follows your range.
                  </p>
                )}
          </>
        )}
      </ReportPanel>

      <ReportPanel state={activity} skeletonClassName="h-80 w-full">
        {data => (
          <ActivityChart
            granularity={granularity}
            onGranularityChange={setGranularity}
            series={data.series}
            metric={metric}
            color={game ? resolveColor(meta, game) : undefined}
            title={`${selectedLabel ?? 'All games'} — last ${data.window} days`}
            description={`${data.totals.games_started.toLocaleString()} played, ${data.totals.games_finished.toLocaleString()} finished, ${data.totals.distinct_players.toLocaleString()} distinct players.`}
          />
        )}
      </ReportPanel>

      <ReportPanel state={patterns} skeletonClassName="h-72 w-full">
        {data => <NewVsReturning rows={data.new_vs_returning} />}
      </ReportPanel>

      {allGames.data && (
        <div className="flex justify-end">
          <ExportButton<GameTotals>
            view="games"
            rows={allGames.data.by_game}
            filters={{ start: allGames.data.start, end: allGames.data.end, bots: includeBots }}
            columns={[
              { header: 'Game', value: row => row.game_type },
              { header: 'Played', value: row => row.games_started },
              { header: 'Finished', value: row => row.games_finished },
              { header: 'Players', value: row => row.distinct_players },
              { header: 'Multiplayer', value: row => row.mp_player_sessions },
              { header: 'Solo', value: row => row.games_started - row.mp_player_sessions },
              { header: 'Completion %', value: row => row.completion_pct },
              { header: 'Sessions per player', value: row => row.sessions_per_player },
              { header: 'Repeat %', value: row => row.repeat_rate_pct },
              { header: 'Share %', value: row => row.share_pct },
              { header: 'Trend %', value: row => row.trend_pct },
              { header: 'Previous period played', value: row => row.previous_games_started },
            ]}
          />
        </div>
      )}

      {allGames.data && (
        <GameLeaderboard
          rows={allGames.data.by_game}
          meta={meta}
          metric={metric}
          selected={game}
          onSelect={next => update({ game: next })}
        />
      )}
    </ReportsShell>
  );
}
