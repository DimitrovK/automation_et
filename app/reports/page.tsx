'use client';

import type { ReportWindow } from '@/types/reports';
import { useMemo, useState } from 'react';
import { ActivityChart } from '@/components/reports/ActivityChart';
import { PulseTiles } from '@/components/reports/PulseTiles';
import { ReportError } from '@/components/reports/ReportError';
import { ReportsShell } from '@/components/reports/ReportsShell';
import { WindowPicker } from '@/components/reports/WindowPicker';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useReport } from '@/hooks/use-report';
import { useAuth } from '@/lib/auth';
import { ReportsAPI } from '@/lib/reports-api';
import { prettySlug } from '@/lib/user-hub-format';

export default function ReportsPage() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);

  const [window, setWindow] = useState<ReportWindow>(30);
  const [includeBots, setIncludeBots] = useState(false);

  const params = useMemo(() => ({ window, include_bots: includeBots }), [window, includeBots]);

  // ReportsAPI methods are static, so the references are already stable across
  // renders — no useCallback needed to keep useReport's effect from re-firing.
  const summary = useReport(ReportsAPI.getSummary, params, enabled, 'The reporting summary endpoint');
  const activity = useReport(ReportsAPI.getActivity, params, enabled, 'The reporting activity endpoint');

  return (
    <ReportsShell
      title="Daily Pulse"
      description="How today is going, measured against a typical day of the same weekday."
    >
      <WindowPicker
        value={window}
        onChange={setWindow}
        includeBots={includeBots}
        onIncludeBotsChange={setIncludeBots}
      />

      {summary.error
        ? <ReportError error={summary.error} notDeployed={summary.notDeployed} onRetry={summary.refetch} />
        : summary.isLoading || !summary.data
          ? <Skeleton className="h-32 w-full" />
          : (
              <>
                <PulseTiles pulse={summary.data.pulse} />
                <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                  Compared with the mean of the last
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
                title={`Activity — last ${activity.data.window} days`}
                description={`${activity.data.totals.games_started.toLocaleString()} games started, ${activity.data.totals.games_finished.toLocaleString()} finished, ${activity.data.totals.distinct_players.toLocaleString()} distinct players.`}
              />
            )}

      {summary.data && (
        <Card>
          <CardHeader>
            <CardTitle>By game</CardTitle>
            <CardDescription>
              Busiest first over the last
              {' '}
              {summary.data.window}
              {' '}
              days. Solo is games started minus multiplayer participations.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-600 dark:border-slate-700 dark:text-gray-300">
                  <th className="py-2 pr-4 font-medium">Game</th>
                  <th className="py-2 pr-4 text-right font-medium">Started</th>
                  <th className="py-2 pr-4 text-right font-medium">Finished</th>
                  <th className="py-2 pr-4 text-right font-medium">Players</th>
                  <th className="py-2 pr-4 text-right font-medium">Multiplayer</th>
                  <th className="py-2 text-right font-medium">Solo</th>
                </tr>
              </thead>
              <tbody>
                {summary.data.by_game.map(row => (
                  <tr key={row.game_type} className="border-b last:border-0 dark:border-slate-700">
                    <td className="py-2 pr-4 font-medium text-gray-900 dark:text-white">
                      {prettySlug(row.game_type)}
                    </td>
                    <td className="py-2 pr-4 text-right">{row.games_started.toLocaleString()}</td>
                    <td className="py-2 pr-4 text-right">{row.games_finished.toLocaleString()}</td>
                    <td className="py-2 pr-4 text-right">{row.distinct_players.toLocaleString()}</td>
                    <td className="py-2 pr-4 text-right">{row.mp_player_sessions.toLocaleString()}</td>
                    <td className="py-2 text-right">
                      {(row.games_started - row.mp_player_sessions).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </ReportsShell>
  );
}
