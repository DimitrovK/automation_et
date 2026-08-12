'use client';

import type { ReportWindow } from '@/types/reports';
import { useMemo, useState } from 'react';
import { ReportError } from '@/components/reports/ReportError';
import { ReportsShell } from '@/components/reports/ReportsShell';
import { WindowPicker } from '@/components/reports/WindowPicker';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useReport } from '@/hooks/use-report';
import { useAuth } from '@/lib/auth';
import { ReportsAPI } from '@/lib/reports-api';
import { prettySlug } from '@/lib/user-hub-format';

export default function PlayersReportPage() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);

  const [window, setWindow] = useState<ReportWindow>(7);
  const [includeBots, setIncludeBots] = useState(false);
  const params = useMemo(
    () => ({ window, include_bots: includeBots, limit: 25 }),
    [window, includeBots],
  );

  // ReportsAPI methods are static, so the reference is already stable across
  // renders — no useCallback needed to stop useReport's effect re-firing.
  const { data, isLoading, error, notDeployed, refetch } = useReport(
    ReportsAPI.getTopPlayers,
    params,
    enabled,
    'The top-players reporting endpoint',
  );

  return (
    <ReportsShell
      title="Players"
      description="Who played the most. Bot/simulation accounts are excluded by default."
    >
      <WindowPicker
        value={window}
        onChange={setWindow}
        includeBots={includeBots}
        onIncludeBotsChange={setIncludeBots}
      />

      {error
        ? <ReportError error={error} notDeployed={notDeployed} onRetry={refetch} />
        : isLoading || !data
          ? <Skeleton className="h-96 w-full" />
          : (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Most active — last
                    {' '}
                    {data.window}
                    {' '}
                    days
                  </CardTitle>
                  <CardDescription>
                    Games played counts sessions started, matching the Daily Pulse.
                  </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-gray-600 dark:border-slate-700 dark:text-gray-300">
                        <th className="py-2 pr-4 font-medium">#</th>
                        <th className="py-2 pr-4 font-medium">Player</th>
                        <th className="py-2 pr-4 text-right font-medium">Played</th>
                        <th className="py-2 pr-4 text-right font-medium">Finished</th>
                        <th className="py-2 font-medium">Games</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.players.map((player, index) => (
                        <tr key={player.user_id} className="border-b last:border-0 dark:border-slate-700">
                          <td className="py-2 pr-4 text-gray-500 dark:text-gray-400">{index + 1}</td>
                          <td className="py-2 pr-4 font-medium text-gray-900 dark:text-white">
                            {player.username}
                          </td>
                          <td className="py-2 pr-4 text-right">{player.games_played.toLocaleString()}</td>
                          <td className="py-2 pr-4 text-right">{player.games_finished.toLocaleString()}</td>
                          <td className="py-2">
                            <div className="flex flex-wrap gap-1">
                              {player.games.map(game => (
                                <Badge key={game} variant="secondary" className="text-xs">
                                  {prettySlug(game)}
                                </Badge>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {data.players.length === 0 && (
                    <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                      Nobody played in this window.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
    </ReportsShell>
  );
}
