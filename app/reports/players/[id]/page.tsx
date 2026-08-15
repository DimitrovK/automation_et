'use client';

import type { RangeState } from '@/lib/report-range';
import type { ReportParams } from '@/types/reports';
import { ArrowLeft } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartTooltip } from '@/components/reports/charts/ChartTooltip';
import { FilterBar } from '@/components/reports/filters/FilterBar';
import { RangePicker } from '@/components/reports/filters/RangePicker';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { GameBadge } from '@/components/reports/primitives/GameBadge';
import { ReportPanel } from '@/components/reports/primitives/ReportPanel';
import { StatTile } from '@/components/reports/primitives/StatTile';
import { ReportsShell } from '@/components/reports/shell/ReportsShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGameColor, useGameMeta } from '@/hooks/use-game-meta';
import { useReport } from '@/hooks/use-report';
import { useReportFilters } from '@/hooks/use-report-filters';
import { useAuth } from '@/lib/auth';
import { chartTheme } from '@/lib/chart-theme';
import { playStyle } from '@/lib/play-style';
import { rangeToParams } from '@/lib/report-range';
import { ReportsAPI } from '@/lib/reports-api';

export default function PlayerDetailPage() {
  const { resolvedTheme } = useTheme();
  const theme = chartTheme(resolvedTheme === 'dark');
  const resolveColor = useGameColor();
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);
  const routeParams = useParams();
  const userId = Number(routeParams?.id);

  // Filters live in the URL so a view can be bookmarked, shared or reloaded
  // without losing what was selected.
  const { filters, update } = useReportFilters({
    range: { window: 30 },
    includeBots: false,
    game: null,
    metric: 'games_started',
  });
  // No bot or game filter here: this endpoint is scoped to one user, so neither
  // applies — echoing them back would imply a filter the query ignores.
  const { range } = filters;
  const setRange = (next: RangeState) => update({ range: next });
  const params = useMemo(() => rangeToParams(range), [range]);

  const { meta } = useGameMeta(enabled);

  // Must be memoised. useReport keys its effect on the fetcher's identity, and
  // every other page passes a static ReportsAPI method, which is stable for
  // free. This is the only endpoint taking a bound argument, so an inline arrow
  // here is a new function on every render: effect refires -> setState ->
  // re-render -> new arrow, and the page requests the API forever.
  const fetchPlayerDetail = useCallback(
    (reportParams?: ReportParams) => ReportsAPI.getPlayerDetail(userId, reportParams),
    [userId],
  );

  const state = useReport(
    fetchPlayerDetail,
    params,
    enabled && Number.isFinite(userId),
    'The player detail endpoint',
    // userId lives in the path, not in params, so it has to be declared here for
    // navigating between players to refetch.
    String(userId),
  );

  // Derived here rather than inside the tile so the tile can be omitted
  // entirely when the backend hasn't sent a count — a tile reading "—" would
  // claim we know, and that the answer is none.
  const style = playStyle(state.data?.totals.games_played ?? 0, state.data?.totals.mp_sessions);

  return (
    <ReportsShell
      title={state.data ? state.data.username : 'Player'}
      description="One player's activity: what they play, how much they finish, and how often they show up."
    >
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/reports/players"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="size-4" />
          All players
        </Link>
        <FilterBar>
          <RangePicker
            value={range}
            onChange={setRange}
            includeBots={false}
            onIncludeBotsChange={() => undefined}
          />
        </FilterBar>

        {/* Bot accounts are filtered out of every other report, so landing here
            from a direct link is the one way to read simulation traffic as real
            play. The BE already flags it; nothing was showing it. */}
        {state.data?.is_bot && (
          <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
            Bot / simulation account — excluded from every other report
          </span>
        )}
      </div>

      <ReportPanel state={state} skeletonClassName="h-96 w-full">
        {data => (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatTile
                label="Games played"
                value={data.totals.games_played.toLocaleString()}
                hint={`${data.totals.games_finished.toLocaleString()} finished`}
              />
              <StatTile
                label="Completion"
                value={data.totals.completion_pct === null ? '—' : `${data.totals.completion_pct}%`}
                hint="Of the games they started"
              />
              <StatTile
                label="Active days"
                value={`${data.totals.active_days} / ${data.days}`}
                hint={data.totals.active_days_pct === null ? '' : `${data.totals.active_days_pct}% of the range`}
              />
              <StatTile
                label="Games per active day"
                value={data.totals.games_per_active_day?.toString() ?? '—'}
                hint="Habit vs one big session"
              />
              {/* Who they play with, which the session count alone cannot
                  say: the same 41 sessions belong to a solo grinder and to
                  a lobby regular, and only one of them stops when their
                  friends do. */}
              {style && (
                <StatTile
                  label="Play style"
                  value={style.label ?? '—'}
                  hint={`${style.mp.toLocaleString()} multiplayer · ${style.solo.toLocaleString()} solo`}
                />
              )}
            </div>

            {data.totals.games_played === 0 && (
              <EmptyState className="rounded-md border border-dashed">
                This player didn't play anything in the selected range.
              </EmptyState>
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
                        <Tooltip content={<ChartTooltip />} cursor={theme.tooltip.cursor} />
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
                              fill={resolveColor(meta, row.game_type)}
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
                        <GameBadge gameKey={row.game_type} meta={meta} href={`/reports/games/${row.game_type}`} />
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {row.games_played.toLocaleString()}
                          {' played · '}
                          {row.completion_pct}
                          % finished
                          {/* Per game, because the split moves: someone can
                              be a lobby regular in one game and play the
                              rest alone. A known zero says "all solo" rather
                              than nothing — hiding it would make it
                              indistinguishable from a field the backend
                              never sent. */}
                          {row.mp_sessions !== undefined && (
                            <>
                              {' · '}
                              {row.mp_sessions === 0
                                ? 'all solo'
                                : `${row.mp_sessions.toLocaleString()} multiplayer`}
                            </>
                          )}
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
                    <CartesianGrid strokeDasharray="3 3" stroke={theme.grid.stroke} />
                    <XAxis dataKey="date" tick={theme.tick} interval="preserveStartEnd" minTickGap={24} />
                    <YAxis tick={theme.tick} allowDecimals={false} width={44} />
                    <Tooltip content={<ChartTooltip />} cursor={theme.tooltip.cursor} />
                    <Area type="monotone" dataKey="games_started" name="Played" stroke={theme.series[0]} fill={theme.series[0]} fillOpacity={0.35} />
                    <Area type="monotone" dataKey="games_finished" name="Finished" stroke={theme.series[1]} fill={theme.series[1]} fillOpacity={0.25} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </>
        )}
      </ReportPanel>
    </ReportsShell>
  );
}
