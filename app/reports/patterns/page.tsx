'use client';

import type { RangeState } from '@/lib/report-range';
import { useMemo, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ActivityHeatmap } from '@/components/reports/ActivityHeatmap';
import { MetricInfo } from '@/components/reports/MetricInfo';
import { GameFilter } from '@/components/reports/GameFilter';
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

function Tile({ label, value, hint, metric }: { label: string; value: string; hint: string; metric?: string }) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
          {label}
          {metric && <MetricInfo metric={metric} />}
        </p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>
      </CardContent>
    </Card>
  );
}

export default function PatternsPage() {
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
  const { data, isLoading, error, notDeployed, refetch } = useReport(
    ReportsAPI.getPatterns,
    params,
    enabled,
    'The reporting patterns endpoint',
  );

  const peakHourCount = data?.by_hour.find(row => row.hour === data.peak_hour)?.games_started ?? 0;
  const quietestDay = data ? [...data.by_weekday].sort((a, b) => a.games_started - b.games_started)[0] : null;

  return (
    <ReportsShell
      title="Patterns"
      description="When people play, and whether the players are new or coming back."
    >
      <RangePicker
        value={range}
        onChange={setRange}
        includeBots={includeBots}
        onIncludeBotsChange={setIncludeBots}
      />

      <GameFilter meta={meta} value={game} onChange={setGame} />

      {error
        ? <ReportError error={error} notDeployed={notDeployed} onRetry={refetch} />
        : isLoading || !data
          ? <Skeleton className="h-96 w-full" />
          : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <Tile
                    label="Busiest slot"
                    metric="peak_cell"
                    value={data.peak_cell
                      ? `${data.peak_cell.name.slice(0, 3)} ${String(data.peak_cell.hour).padStart(2, '0')}:00`
                      : '—'}
                    // The marginals give a different, wrong answer here — the
                    // peak day and peak hour need not intersect at a busy cell.
                    hint={data.peak_cell
                      ? `${data.peak_cell.games_started.toLocaleString()} games · busiest single hour`
                      : 'No activity in this window'}
                  />
                  <Tile
                    label="Peak hour"
                    metric="peak_hour"
                    value={data.peak_hour === null ? '—' : `${String(data.peak_hour).padStart(2, '0')}:00`}
                    hint={`${peakHourCount.toLocaleString()} games · ${data.timezone}`}
                  />
                  <Tile
                    label="Busiest day"
                    value={data.peak_weekday ?? '—'}
                    hint="Highest total over the range"
                  />
                  <Tile
                    label="Quietest day"
                    value={quietestDay?.name ?? '—'}
                    hint={quietestDay ? `${quietestDay.games_started.toLocaleString()} games` : '—'}
                  />
                </div>

                {/* Above the two bar charts: it answers the scheduling question
                    they can only approximate, so reading them first would mean
                    forming a wrong answer and then correcting it. */}
                <ActivityHeatmap
                  rows={data.by_hour_weekday}
                  peakCell={data.peak_cell}
                  busiest={data.busiest_cell_games}
                  timezone={data.timezone}
                />

                <Card>
                  <CardHeader>
                    <CardTitle>By hour of day</CardTitle>
                    <CardDescription>
                      Local time (
                      {data.timezone}
                      ), so the evening peak sits where you'd expect rather than
                      shifted by the server's UTC offset. Useful for timing events,
                      deploys and announcements.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-64 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.by_hour} margin={{ top: 8, right: 8, bottom: 8, left: -12 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
                        <XAxis dataKey="hour" tick={{ fontSize: 11 }} tickFormatter={h => `${h}:00`} interval={1} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={44} />
                        <Tooltip
                          contentStyle={{ fontSize: 12 }}
                          labelFormatter={h => `${String(h).padStart(2, '0')}:00`}
                        />
                        <Bar dataKey="games_started" name="Games" radius={[3, 3, 0, 0]}>
                          {data.by_hour.map(row => (
                            <Cell
                              key={row.hour}
                              fill={row.hour === data.peak_hour ? '#059669' : '#94a3b8'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>By weekday</CardTitle>
                    <CardDescription>
                      This is why the Daily Pulse compares today with the same weekday
                      rather than with yesterday — the weekend gap would otherwise read
                      as a crash every week.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-56 sm:h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.by_weekday} margin={{ top: 8, right: 8, bottom: 8, left: -12 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} tickFormatter={name => name.slice(0, 3)} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={44} />
                        <Tooltip contentStyle={{ fontSize: 12 }} />
                        <Bar dataKey="games_started" name="Games" radius={[3, 3, 0, 0]}>
                          {data.by_weekday.map(row => (
                            <Cell
                              key={row.weekday}
                              fill={row.name === data.peak_weekday ? '#059669' : '#94a3b8'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>New vs returning players</CardTitle>
                    <CardDescription>
                      "New" means the account was registered that day. A healthy day has
                      both — all-returning means growth has stalled, all-new means nobody
                      is staying.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-64 sm:h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.new_vs_returning} margin={{ top: 8, right: 8, bottom: 8, left: -12 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={24} />
                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={44} />
                        <Tooltip contentStyle={{ fontSize: 12 }} />
                        <Area
                          type="monotone"
                          dataKey="returning_players"
                          name="Returning"
                          stackId="players"
                          stroke="#2563eb"
                          fill="#2563eb"
                          fillOpacity={0.5}
                        />
                        <Area
                          type="monotone"
                          dataKey="new_players"
                          name="New"
                          stackId="players"
                          stroke="#059669"
                          fill="#059669"
                          fillOpacity={0.8}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}
    </ReportsShell>
  );
}
