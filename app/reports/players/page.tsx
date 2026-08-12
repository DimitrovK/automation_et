'use client';

import type { RangeState } from '@/lib/report-range';
import { useMemo, useState } from 'react';
import { GameBadge } from '@/components/reports/GameBadge';
import { RangePicker } from '@/components/reports/RangePicker';
import { ReportError } from '@/components/reports/ReportError';
import { ReportsShell } from '@/components/reports/ReportsShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGameMeta } from '@/hooks/use-game-meta';
import { useReport } from '@/hooks/use-report';
import { useAuth } from '@/lib/auth';
import { rangeToParams } from '@/lib/report-range';
import { ReportsAPI } from '@/lib/reports-api';

export default function PlayersReportPage() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);

  const [range, setRange] = useState<RangeState>({ window: 7 });
  const [includeBots, setIncludeBots] = useState(false);
  const [game, setGame] = useState<string | null>(null);
  // 'played' ranks by sessions started, 'finished' by ones seen through — the gap
  // between them is the interesting part, so both are reachable.
  const [sortBy, setSortBy] = useState<'played' | 'finished'>('played');

  const params = useMemo(
    () => ({ ...rangeToParams(range), include_bots: includeBots, limit: 25, ...(game ? { game_type: game } : {}) }),
    [range, includeBots, game],
  );

  const { meta } = useGameMeta(enabled);

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
      <RangePicker
        value={range}
        onChange={setRange}
        includeBots={includeBots}
        onIncludeBotsChange={setIncludeBots}
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-300">Rank by</span>
        <Button size="sm" variant={sortBy === 'played' ? 'default' : 'outline'} onClick={() => setSortBy('played')}>
          Played
        </Button>
        <Button size="sm" variant={sortBy === 'finished' ? 'default' : 'outline'} onClick={() => setSortBy('finished')}>
          Finished
        </Button>
      </div>

      {game && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-900/20">
          <span className="text-sm text-gray-700 dark:text-gray-200">Filtered to</span>
          <GameBadge gameKey={game} meta={meta} active onClick={() => setGame(null)} />
        </div>
      )}

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
                              {player.games.map(playedGame => (
                                <GameBadge
                                  key={playedGame}
                                  gameKey={playedGame}
                                  meta={meta}
                                  active={game === playedGame}
                                  onClick={key => setGame(game === key ? null : key)}
                                />
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
