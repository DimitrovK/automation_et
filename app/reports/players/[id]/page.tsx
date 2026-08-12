'use client';

import type { RangeState } from '@/lib/report-range';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { GameBadge } from '@/components/reports/GameBadge';
import { RangePicker } from '@/components/reports/RangePicker';
import { ReportError } from '@/components/reports/ReportError';
import { ReportsShell } from '@/components/reports/ReportsShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FALLBACK_COLOR, useGameMeta } from '@/hooks/use-game-meta';
import { useReport } from '@/hooks/use-report';
import { useAuth } from '@/lib/auth';
import { rangeToParams } from '@/lib/report-range';
import { ReportsAPI } from '@/lib/reports-api';

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {hint && <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default function PlayerDetailPage() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);
  const routeParams = useParams();
  const userId = Number(routeParams?.id);

  const [range, setRange] = useState<RangeState>({ window: 30 });
  const params = useMemo(() => rangeToParams(range), [range]);

  const { meta } = useGameMeta(enabled);
  const { data, isLoading, error, notDeployed, refetch } = useReport(
    // Bound to this route's id, so the hook's generic fetcher signature still fits.
    reportParams => ReportsAPI.getPlayerDetail(userId, reportParams),
    params,
    enabled && Number.isFinite(userId),
    'The player detail endpoint',
  );

  return (
    <ReportsShell
      title={data ? data.username : 'Player'}
      description="One player's activity: what they play, how much they finish, and how often they show up."
    >
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/reports/players"
          className="inline-flex items-center gap-1 text-sm text-emerald-700 hover:underline dark:text-emerald-400"
        >
          <ArrowLeft className="size-4" />
          All players
        </Link>
        <RangePicker
          value={range}
          onChange={setRange}
          includeBots={false}
          onIncludeBotsChange={() => undefined}
        />
      </div>

      {error
        ? <ReportError error={error} notDeployed={notDeployed} onRetry={refetch} />
        : isLoading || !data
          ? <Skeleton className="h-96 w-full" />
          : (
              <>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  <Tile
                    label="Games played"
                    value={data.totals.games_played.toLocaleString()}
                    hint={`${data.totals.games_finished.toLocaleString()} finished`}
                  />
                  <Tile
                    label="Completion"
                    value={data.totals.completion_pct === null ? '—' : `${data.totals.completion_pct}%`}
                    hint="Of the games they started"
                  />
                  <Tile
                    label="Active days"
                    value={`${data.totals.active_days} / ${data.days}`}
                    hint={data.totals.active_days_pct === null ? '' : `${data.totals.active_days_pct}% of the range`}
                  />
                  <Tile
                    label="Games per active day"
                    value={data.totals.games_per_active_day?.toString() ?? '—'}
                    hint="Habit vs one big session"
                  />
                </div>

                {data.totals.games_played === 0 && (
                  <p className="rounded-md border border-dashed p-6 text-center text-sm text-gray-500 dark:border-slate-700 dark:text-gray-400">
                    This player didn't play anything in the selected range.
                  </p>
                )}

                {data.by_game.length > 0 && (
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>What they play</CardTitle>
                        <CardDescription>
                          Favourite:
                          {' '}
                          {data.favourite_game ? (meta[data.favourite_game]?.label ?? data.favourite_game) : '—'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Tooltip contentStyle={{ fontSize: 12 }} />
                            <Pie
                              data={data.by_game}
                              dataKey="games_played"
                              nameKey="game_type"
                              innerRadius="45%"
                              outerRadius="75%"
                              paddingAngle={2}
                            >
                              {data.by_game.map(row => (
                                <Cell
                                  key={row.game_type}
                                  fill={meta[row.game_type]?.color ?? FALLBACK_COLOR}
                                />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Per game</CardTitle>
                        <CardDescription>
                          Completion varies by game — a low rate here is about that game,
                          not the player. Click a game to see its own report.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {data.by_game.map(row => (
                          <div key={row.game_type} className="flex flex-wrap items-center justify-between gap-2">
                            <GameBadge gameKey={row.game_type} meta={meta} />
                            <span className="text-sm tabular-nums text-gray-600 dark:text-gray-300">
                              {row.games_played.toLocaleString()}
                              {' played · '}
                              {row.completion_pct}
                              % finished
                            </span>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                )}

                <Card>
                  <CardHeader>
                    <CardTitle>Activity</CardTitle>
                    <CardDescription>
                      Zero-filled, so gaps are real days off rather than a compressed axis.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-64 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.series} margin={{ top: 8, right: 8, bottom: 8, left: -12 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={24} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={44} />
                        <Tooltip contentStyle={{ fontSize: 12 }} />
                        <Area type="monotone" dataKey="games_started" name="Played" stroke="#059669" fill="#059669" fillOpacity={0.35} />
                        <Area type="monotone" dataKey="games_finished" name="Finished" stroke="#2563eb" fill="#2563eb" fillOpacity={0.25} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}
    </ReportsShell>
  );
}
