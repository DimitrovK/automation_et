'use client';

import type { RangeState } from '@/lib/report-range';
import { useMemo, useState } from 'react';
import { GameBadge } from '@/components/reports/GameBadge';
import { ModeBreakdown } from '@/components/reports/ModeBreakdown';
import { MultiplayerFunnel } from '@/components/reports/MultiplayerFunnel';
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
import { prettySlug } from '@/lib/user-hub-format';

export default function MultiplayerReportPage() {
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
  const setGame = (next: string | null) => update({ game: next });
  const params = useMemo(
    () => ({ ...rangeToParams(range), include_bots: includeBots, ...(game ? { game_type: game } : {}) }),
    [range, includeBots, game],
  );

  const { meta } = useGameMeta(enabled);

  // ReportsAPI methods are static, so the reference is already stable across
  // renders — no useCallback needed to stop useReport's effect re-firing.
  const { data, isLoading, error, notDeployed, refetch } = useReport(
    ReportsAPI.getMultiplayer,
    params,
    enabled,
    'The multiplayer reporting endpoint',
  );

  return (
    <ReportsShell
      title="Multiplayer"
      description="Rooms opened, started and finished. Counts rooms — not per-player participations."
    >
      <RangePicker
        value={range}
        onChange={setRange}
        includeBots={includeBots}
        onIncludeBotsChange={setIncludeBots}
      />

      {game && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-900/20">
          <span className="text-sm text-gray-700 dark:text-gray-200">Filtered to</span>
          <GameBadge gameKey={game} meta={meta} active onClick={() => setGame(null)} />
        </div>
      )}

      <div className="flex justify-end">
        <ExportButton
          rows={data?.by_game ?? []}
          view="multiplayer"
          filters={{ ...rangeToParams(range), bots: includeBots, game }}
          columns={[
                    { header: 'Game', value: row => row.game_type },
                    { header: 'Rooms created', value: row => row.rooms_created },
                    { header: 'Started', value: row => row.rooms_started },
                    { header: 'Finished', value: row => row.rooms_finished },
                    { header: 'Cancelled', value: row => row.rooms_cancelled },
                    { header: 'Never started %', value: row => row.never_started_pct },
                  ]}
        />
      </div>

      {error
        ? <ReportError error={error} notDeployed={notDeployed} onRetry={refetch} />
        : isLoading || !data
          ? <Skeleton className="h-64 w-full" />
          : (
              <>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {[
                    { label: 'Rooms created', value: data.totals.rooms_created },
                    { label: 'Started', value: data.totals.rooms_started },
                    { label: 'Finished', value: data.totals.rooms_finished },
                    { label: 'Cancelled', value: data.totals.rooms_cancelled },
                  ].map(tile => (
                    <Card key={tile.label}>
                      <CardContent className="p-4">
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{tile.label}</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">
                          {tile.value.toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Above the per-game table: modes are shared across games, so
                    "is Elimination working anywhere" is a question the per-game
                    split can't answer, and it's the one you ask first. */}
                {/* Ahead of the mode split and the table: "which stage loses
                    people" is the first question, and both of those make you do
                    the subtraction yourself. */}
                <MultiplayerFunnel rows={data.by_game} meta={meta} />

                <ModeBreakdown rows={data.by_mode} meta={meta} onSelectGame={key => setGame(game === key ? null : key)} />

                <Card>
                  <CardHeader>
                    <CardTitle>Lobbies that never started</CardTitle>
                    <CardDescription>
                      {data.totals.never_started_pct}
                      % of rooms opened in this window never got going. High values usually
                      mean people couldn't find enough players.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-left text-gray-600 dark:border-slate-700 dark:text-gray-300">
                          <th className="py-2 pr-4 font-medium">Game</th>
                          <th className="py-2 pr-4 text-right font-medium">Created</th>
                          <th className="py-2 pr-4 text-right font-medium">Started</th>
                          <th className="py-2 pr-4 text-right font-medium">Finished</th>
                          <th className="py-2 pr-4 text-right font-medium">Cancelled</th>
                          <th className="py-2 text-right font-medium">Never started</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.by_game.map(row => (
                          <tr key={row.game_type} className="border-b last:border-0 dark:border-slate-700">
                            <td className="py-2 pr-4 font-medium text-gray-900 dark:text-white">
                              {prettySlug(row.game_type)}
                            </td>
                            <td className="py-2 pr-4 text-right">{row.rooms_created.toLocaleString()}</td>
                            <td className="py-2 pr-4 text-right">{row.rooms_started.toLocaleString()}</td>
                            <td className="py-2 pr-4 text-right">{row.rooms_finished.toLocaleString()}</td>
                            <td className="py-2 pr-4 text-right">{row.rooms_cancelled.toLocaleString()}</td>
                            <td className="py-2 text-right">
                              {row.never_started_pct}
                              %
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {data.by_game.length === 0 && (
                      <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        No multiplayer rooms in this window.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
    </ReportsShell>
  );
}
