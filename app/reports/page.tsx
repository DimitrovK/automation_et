'use client';

import type { Sensitivity } from '@/components/reports/AnomalySensitivity';
import type { GameTotals } from '@/types/reports';
import { useMemo, useState } from 'react';
import { ActivityChart } from '@/components/reports/ActivityChart';
import { AnomalyPanel } from '@/components/reports/AnomalyPanel';
import { RollupHealthBanner } from '@/components/reports/RollupHealthBanner';
import { AnomalySensitivity, SENSITIVITY_PRESETS } from '@/components/reports/AnomalySensitivity';
import { ExportButton } from '@/components/reports/ExportButton';
import { GameBadge } from '@/components/reports/GameBadge';
import { GameLeaderboard } from '@/components/reports/GameLeaderboard';
import { MetricToggle } from '@/components/reports/MetricToggle';
import { PulseTiles } from '@/components/reports/PulseTiles';
import { RangePicker } from '@/components/reports/RangePicker';
import { ReportPanel } from '@/components/reports/ReportPanel';
import { ReportsShell } from '@/components/reports/ReportsShell';
import { useGameMeta, useGameColor } from '@/hooks/use-game-meta';
import { useReport } from '@/hooks/use-report';
import { useReportFilters } from '@/hooks/use-report-filters';
import { useAuth } from '@/lib/auth';
import { rangeToParams } from '@/lib/report-range';
import { ReportsAPI } from '@/lib/reports-api';

export default function ReportsPage() {
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

  const { meta } = useGameMeta(enabled);
  const summary = useReport(ReportsAPI.getSummary, params, enabled, 'The reporting summary endpoint');
  const allGames = useReport(ReportsAPI.getSummary, allGamesParams, enabled, 'The reporting summary endpoint');
  const activity = useReport(ReportsAPI.getActivity, params, enabled, 'The reporting activity endpoint');
  // Unfiltered on purpose: "what needs attention" must surface a game you
  // haven't selected, which is exactly the one you'd otherwise miss.
  // Kept local rather than in the URL: it changes what counts as worth
  // reporting, not what the report covers, so a shared link should carry the
  // period and games — not the reader's tolerance for noise.
  const [sensitivity, setSensitivity] = useState<Sensitivity>('default');
  const anomalyParams = useMemo(
    () => ({
      ...allGamesParams,
      min_volume: SENSITIVITY_PRESETS[sensitivity].min_volume,
      min_change_pct: SENSITIVITY_PRESETS[sensitivity].min_change_pct,
    }),
    [allGamesParams, sensitivity],
  );
  const anomalies = useReport(ReportsAPI.getAnomalies, anomalyParams, enabled, 'The anomalies reporting endpoint');

  const selectedLabel = game ? (meta[game]?.label ?? game) : null;

  return (
    <ReportsShell
      title="Daily Pulse"
      description="How today is going, measured against a typical day of the same weekday."
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <RangePicker
          value={range}
          onChange={next => update({ range: next })}
          includeBots={includeBots}
          onIncludeBotsChange={value => update({ includeBots: value })}
        />
        <MetricToggle value={metric} onChange={next => update({ metric: next })} />
      </div>

      {game && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-900/20">
          <span className="text-sm text-gray-700 dark:text-gray-200">Filtered to</span>
          <GameBadge gameKey={game} meta={meta} active onClick={() => update({ game: null })} />
        </div>
      )}

      {/* Above the anomalies: if the rollup is incomplete, "nothing moved" is
          not a finding, and every panel below inherits that doubt. */}
      <RollupHealthBanner />

      {/* Was `anomalies.data && …`, so a failed request made the panel vanish
          without saying so — the one panel whose silence reads as "nothing
          moved". It now reports its own failure. */}
      <ReportPanel state={anomalies} skeletonClassName="h-24 w-full">
        {data => (
          <div className="space-y-2">
            <AnomalyPanel data={data} meta={meta} />
            <AnomalySensitivity value={sensitivity} onChange={setSensitivity} />
          </div>
        )}
      </ReportPanel>

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
                        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
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
                      <p className="rounded-md border border-gray-200 bg-gray-50 p-3 text-center text-sm text-gray-600 dark:border-slate-700 dark:bg-slate-800 dark:text-gray-300">
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
            series={data.series}
            metric={metric}
            color={game ? resolveColor(meta, game) : undefined}
            title={`${selectedLabel ?? 'All games'} — last ${data.window} days`}
            description={`${data.totals.games_started.toLocaleString()} played, ${data.totals.games_finished.toLocaleString()} finished, ${data.totals.distinct_players.toLocaleString()} distinct players.`}
          />
        )}
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
