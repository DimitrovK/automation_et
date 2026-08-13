'use client';

import type { RangeState } from '@/lib/report-range';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ExportButton } from '@/components/reports/ExportButton';
import { GameBadge } from '@/components/reports/GameBadge';
import { PlayStyleBadge } from '@/components/reports/PlayStyleBadge';
import { RangePicker } from '@/components/reports/RangePicker';
import { ReportError } from '@/components/reports/ReportError';
import { ReportsShell } from '@/components/reports/ReportsShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useGameMeta } from '@/hooks/use-game-meta';
import { useReport } from '@/hooks/use-report';
import { useReportFilters } from '@/hooks/use-report-filters';
import { useAuth } from '@/lib/auth';
import { playStyle } from '@/lib/play-style';
import { rangeToParams } from '@/lib/report-range';
import { ReportsAPI } from '@/lib/reports-api';

export default function PlayersReportPage() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);

  // Filters live in the URL so a view can be bookmarked, shared or reloaded
  // without losing what was selected.
  const { filters, update } = useReportFilters({
    range: { window: 7 },
    includeBots: false,
    game: null,
    metric: 'games_started',
    limit: 25,
  });
  const { range, includeBots, game, limit, search } = filters;
  // Local copy so typing stays responsive; the committed value is what the
  // request keys on. Without the split, every keystroke would refetch — and
  // useReport keys on params by value, so it genuinely would fire each time.
  const [draftSearch, setDraftSearch] = useState(search);
  useEffect(() => setDraftSearch(search), [search]);
  useEffect(() => {
    // Compare what will actually be committed. Comparing the raw draft meant
    // typing a trailing space scheduled an update to a value already held —
    // a wasted state change and a pointless replaceState.
    const next = draftSearch.trim();
    if (next === search) {
      return;
    }
    const timer = setTimeout(() => update({ search: next }), 300);
    return () => clearTimeout(timer);
  }, [draftSearch, search, update]);
  const setRange = (next: RangeState) => update({ range: next });
  const setIncludeBots = (next: boolean) => update({ includeBots: next });
  const setGame = (next: string | null) => update({ game: next });
  // 'played' ranks by sessions started, 'finished' by ones seen through — the gap
  // between them is the interesting part, so both are reachable.
  const [sortBy, setSortBy] = useState<'played' | 'finished'>('played');

  const params = useMemo(
    () => ({
      ...rangeToParams(range),
      include_bots: includeBots,
      limit,
      ...(game ? { game_type: game } : {}),
      ...(search ? { search } : {}),
    }),
    [range, includeBots, game, limit, search],
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
        <label htmlFor="player-search" className="text-sm text-gray-600 dark:text-gray-300">Find</label>
        <Input
          id="player-search"
          value={draftSearch}
          onChange={event => setDraftSearch(event.target.value)}
          placeholder="Username"
          className="h-8 w-48"
        />
        {search && (
          <Button size="sm" variant="ghost" onClick={() => setDraftSearch('')}>
            Clear
          </Button>
        )}

        <label htmlFor="row-limit" className="text-sm text-gray-600 dark:text-gray-300">Show</label>
        {/* A dropdown, not three buttons. Row count is a single choice from a
            closed set, which is what a select is for — and three more filled/
            outlined buttons beside the range presets made it read as another
            filter rather than a page size. 100 is the API's own cap. */}
        <Select value={String(limit)} onValueChange={next => update({ limit: Number(next) })}>
          <SelectTrigger id="row-limit" className="h-8 w-[88px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[25, 50, 100].map(size => (
              <SelectItem key={size} value={String(size)}>{size}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Rank by</span>
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

      <div className="flex justify-end">
        <ExportButton
          rows={data?.players ?? []}
          view="players"
          filters={{ ...rangeToParams(range), bots: includeBots, game }}
          columns={[
            { header: 'User ID', value: row => row.user_id },
            { header: 'Username', value: row => row.username },
            { header: 'Played', value: row => row.games_played },
            { header: 'Finished', value: row => row.games_finished },
            // Through the same helper the table uses, so the CSV cannot
            // contradict the screen: subtracting the raw count would
            // export a negative solo figure the UI clamps away.
            { header: 'Multiplayer sessions', value: row => playStyle(row.games_played, row.mp_sessions)?.mp ?? '' },
            { header: 'Solo sessions', value: row => playStyle(row.games_played, row.mp_sessions)?.solo ?? '' },
            { header: 'Distinct games', value: row => row.distinct_games },
            { header: 'Games', value: row => row.games.join(' | ') },
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
                  <CardTitle>
                    Most active — last
                    {' '}
                    {data.window}
                    {' '}
                    days
                  </CardTitle>
                  <CardDescription>
                    Games played counts sessions started, matching the Daily Pulse.
                    Multiplayer sessions are included in that total — the Style column
                    says how much of it they are, which is the difference between a solo
                    grinder and a lobby regular.
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
                        <th className="py-2 pr-4 font-medium">Style</th>
                        <th className="py-2 font-medium">Games</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.players.map((player, index) => (
                        <tr key={player.user_id} className="border-b last:border-0 dark:border-slate-700">
                          <td className="py-2 pr-4 text-gray-500 dark:text-gray-400">{index + 1}</td>
                          <td className="py-2 pr-4 font-medium">
                            {/* The drill-down existed and worked; nothing linked
                                to it, so the only way in was typing a URL. */}
                            <Link
                              href={`/reports/players/${player.user_id}`}
                              className="text-emerald-700 hover:underline dark:text-emerald-400"
                            >
                              {player.username}
                            </Link>
                          </td>
                          <td className="py-2 pr-4 text-right">{player.games_played.toLocaleString()}</td>
                          <td className="py-2 pr-4 text-right">{player.games_finished.toLocaleString()}</td>
                          <td className="py-2 pr-4">
                            <PlayStyleBadge played={player.games_played} mp={player.mp_sessions} />
                          </td>
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
                      {search
                        ? `No player matching "${search}" played in this window.`
                        : 'Nobody played in this window.'}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
    </ReportsShell>
  );
}
