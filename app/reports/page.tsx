'use client';

import type { MetricKey, ReportWindow } from '@/types/reports';
import { useMemo, useState } from 'react';
import { ActivityChart } from '@/components/reports/ActivityChart';
import { GameBadge } from '@/components/reports/GameBadge';
import { GameLeaderboard } from '@/components/reports/GameLeaderboard';
import { MetricToggle } from '@/components/reports/MetricToggle';
import { PulseTiles } from '@/components/reports/PulseTiles';
import { ReportError } from '@/components/reports/ReportError';
import { ReportsShell } from '@/components/reports/ReportsShell';
import { WindowPicker } from '@/components/reports/WindowPicker';
import { Skeleton } from '@/components/ui/skeleton';
import { useGameMeta } from '@/hooks/use-game-meta';
import { useReport } from '@/hooks/use-report';
import { useAuth } from '@/lib/auth';
import { ReportsAPI } from '@/lib/reports-api';

export default function ReportsPage() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);

  const [window, setWindow] = useState<ReportWindow>(30);
  const [includeBots, setIncludeBots] = useState(false);
  const [metric, setMetric] = useState<MetricKey>('games_started');
  const [game, setGame] = useState<string | null>(null);

  // The selected game narrows the pulse, the chart and the tiles together, so
  // the whole page answers "how is THIS game doing" in one click.
  const params = useMemo(
    () => ({ window, include_bots: includeBots, ...(game ? { game_type: game } : {}) }),
    [window, includeBots, game],
  );
  // The leaderboard must always show every game, otherwise selecting one would
  // hide the row you'd click to unselect it.
  const allGamesParams = useMemo(
    () => ({ window, include_bots: includeBots }),
    [window, includeBots],
  );

  const { meta } = useGameMeta(enabled);
  const summary = useReport(ReportsAPI.getSummary, params, enabled, 'The reporting summary endpoint');
  const allGames = useReport(ReportsAPI.getSummary, allGamesParams, enabled, 'The reporting summary endpoint');
  const activity = useReport(ReportsAPI.getActivity, params, enabled, 'The reporting activity endpoint');

  const selectedLabel = game ? (meta[game]?.label ?? game) : null;

  return (
    <ReportsShell
      title="Daily Pulse"
      description="How today is going, measured against a typical day of the same weekday."
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <WindowPicker
          value={window}
          onChange={setWindow}
          includeBots={includeBots}
          onIncludeBotsChange={setIncludeBots}
        />
        <MetricToggle value={metric} onChange={setMetric} />
      </div>

      {game && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-900/20">
          <span className="text-sm text-gray-700 dark:text-gray-200">Filtered to</span>
          <GameBadge gameKey={game} meta={meta} active onClick={() => setGame(null)} />
        </div>
      )}

      {summary.error
        ? <ReportError error={summary.error} notDeployed={summary.notDeployed} onRetry={summary.refetch} />
        : summary.isLoading || !summary.data
          ? <Skeleton className="h-32 w-full" />
          : (
              <>
                <PulseTiles pulse={summary.data.pulse} />
                <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                  {selectedLabel ? `${selectedLabel} · ` : ''}
                  compared with the mean of the last
                  {' '}
                  {summary.data.pulse.baseline_weeks}
                  {' '}
                  {summary.data.pulse.weekday}
                  s — not with yesterday, which would make every Monday look like a crash.
                </p>
              </>
            )}

      {activity.error
        ? <ReportError error={activity.error} notDeployed={activity.notDeployed} onRetry={activity.refetch} />
        : activity.isLoading || !activity.data
          ? <Skeleton className="h-80 w-full" />
          : (
              <ActivityChart
                series={activity.data.series}
                metric={metric}
                color={game ? meta[game]?.color : undefined}
                title={`${selectedLabel ?? 'All games'} — last ${activity.data.window} days`}
                description={`${activity.data.totals.games_started.toLocaleString()} played, ${activity.data.totals.games_finished.toLocaleString()} finished, ${activity.data.totals.distinct_players.toLocaleString()} distinct players.`}
              />
            )}

      {allGames.data && (
        <GameLeaderboard
          rows={allGames.data.by_game}
          meta={meta}
          metric={metric}
          selected={game}
          onSelect={setGame}
        />
      )}
    </ReportsShell>
  );
}
