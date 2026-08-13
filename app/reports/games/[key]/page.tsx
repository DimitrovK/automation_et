'use client';

import type { RangeState } from '@/lib/report-range';
import type { Granularity } from '@/types/reports';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ActivityChart } from '@/components/reports/ActivityChart';
import { ComparePicker } from '@/components/reports/ComparePicker';
import { ComparisonTiles } from '@/components/reports/ComparisonTiles';
import { DurationHistogram } from '@/components/reports/DurationHistogram';
import { DurationTable } from '@/components/reports/DurationTable';
import { GameHourProfile } from '@/components/reports/GameHourProfile';
import { GameRetentionCard } from '@/components/reports/GameRetentionCard';
import { RangePicker } from '@/components/reports/RangePicker';
import { ReportError } from '@/components/reports/ReportError';
import { ReportsShell } from '@/components/reports/ReportsShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGameColor, useGameMeta } from '@/hooks/use-game-meta';
import { useReport } from '@/hooks/use-report';
import { useReportFilters } from '@/hooks/use-report-filters';
import { useAuth } from '@/lib/auth';
import { compareToParams, rangeToParams } from '@/lib/report-range';
import { ReportsAPI } from '@/lib/reports-api';

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
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

/** Everything about one game in one place, instead of filtering five pages by hand. */
export default function GameDetailPage() {
  // Server-side bucketing: a week's distinct players is computed, not
  // summed, so changing this refetches rather than regrouping.
  const [granularity, setGranularity] = useState<Granularity>('day');
  const resolveColor = useGameColor();
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);
  const routeParams = useParams();
  const gameKey = String(routeParams?.key ?? '');

  // Filters live in the URL so a view can be bookmarked, shared or reloaded
  // without losing what was selected.
  const { filters, update } = useReportFilters({
    range: { window: 30 },
    includeBots: false,
    game: null,
    metric: 'games_started',
  });
  const { range, includeBots, compareOffset, compareStart, compareEnd } = filters;
  const setRange = (next: RangeState) => update({ range: next });
  const setIncludeBots = (next: boolean) => update({ includeBots: next });
  const params = useMemo(
    () => ({
      ...rangeToParams(range),
      include_bots: includeBots,
      game_type: gameKey,
      granularity,
      ...compareToParams(compareOffset, compareStart, compareEnd),
    }),
    [range, includeBots, gameKey, granularity, compareOffset, compareStart, compareEnd],
  );

  const { meta } = useGameMeta(enabled);
  const ready = enabled && !!gameKey;
  const summary = useReport(ReportsAPI.getSummary, params, ready, 'The reporting summary endpoint');
  const activity = useReport(ReportsAPI.getActivity, params, ready, 'The reporting activity endpoint');
  const duration = useReport(ReportsAPI.getDuration, params, ready, 'The duration reporting endpoint');
  // Deliberately UNFILTERED: one call carries both this game's row and the
  // median across the others, and the peer median is the only reference this
  // number can be read against. A game-filtered call would return a median of
  // one game — itself.
  const retention = useReport(
    ReportsAPI.getRetention,
    useMemo(() => ({ ...rangeToParams(range), include_bots: includeBots }), [range, includeBots]),
    ready,
    'The retention reporting endpoint',
  );
  const patterns = useReport(ReportsAPI.getPatterns, params, ready, 'The patterns reporting endpoint');
  const players = useReport(
    ReportsAPI.getTopPlayers,
    useMemo(() => ({ ...params, limit: 10 }), [params]),
    ready,
    'The top-players reporting endpoint',
  );

  const label = meta[gameKey]?.label ?? gameKey;
  const row = summary.data?.by_game.find(entry => entry.game_type === gameKey);

  return (
    <ReportsShell
      title={label}
      description="Everything about one game: volume, completion, who plays it and how long they stay."
    >
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/reports"
          className="inline-flex items-center gap-1 text-sm text-emerald-700 hover:underline dark:text-emerald-400"
        >
          <ArrowLeft className="size-4" />
          All games
        </Link>
        <RangePicker
          value={range}
          onChange={setRange}
          includeBots={includeBots}
          onIncludeBotsChange={setIncludeBots}
        />
      </div>

      {summary.error
        ? <ReportError error={summary.error} notDeployed={summary.notDeployed} onRetry={summary.refetch} />
        : summary.isLoading || !summary.data
          ? <Skeleton className="h-32 w-full" />
          : (
              <>
                {/* The picker sits with the tiles it changes, not up with the
                    range: it answers "compared with what", which is a question
                    about these four numbers and nothing else on the page. */}
                <ComparePicker
                  offset={compareOffset}
                  start={compareStart}
                  end={compareEnd}
                  onChange={update}
                />
                <ComparisonTiles comparison={summary.data.comparison} />
                {row && (
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <Stat
                      label="Completion"
                      value={row.completion_pct === null ? '—' : `${row.completion_pct}%`}
                      hint="Of games started"
                    />
                    <Stat
                      label="Repeat rate"
                      value={row.repeat_rate_pct === null ? '—' : `${row.repeat_rate_pct}%`}
                      hint="Players who came back another day"
                    />
                    <Stat
                      label="Sessions per player"
                      value={row.sessions_per_player?.toString() ?? '—'}
                    />
                    <Stat
                      label="Share of platform"
                      value={row.share_pct === null ? '—' : `${row.share_pct}%`}
                      hint="Of all games played"
                    />
                  </div>
                )}
              </>
            )}

      {activity.data && (
        <ActivityChart
          granularity={granularity}
          onGranularityChange={setGranularity}
          series={activity.data.series}
          metric="games_started"
          color={resolveColor(meta, gameKey)}
          title={`${label} — last ${activity.data.days} days`}
          description={`${activity.data.totals.games_started.toLocaleString()} played, ${activity.data.totals.games_finished.toLocaleString()} finished.`}
        />
      )}

      {retention.data && (
        <GameRetentionCard data={retention.data} gameKey={gameKey} gameLabel={label} />
      )}

      {patterns.data && <GameHourProfile data={patterns.data} gameLabel={label} />}

      {duration.data && <DurationTable data={duration.data} meta={meta} />}

      {/* Same data as the table above, drawn as a shape: the table says where
          the middle half sits, this says whether there is one kind of session
          here or several. No extra request — the response is already filtered
          to this game. */}
      {duration.data && <DurationHistogram data={duration.data} meta={meta} />}

      {players.data && (
        <Card>
          <CardHeader>
            <CardTitle>Top players of this game</CardTitle>
            <CardDescription>Ranked within this game only.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-600 dark:border-slate-700 dark:text-gray-300">
                  <th className="py-2 pr-4 font-medium">#</th>
                  <th className="py-2 pr-4 font-medium">Player</th>
                  <th className="py-2 pr-4 text-right font-medium">Played</th>
                  <th className="py-2 text-right font-medium">Finished</th>
                </tr>
              </thead>
              <tbody>
                {players.data.players.map((player, index) => (
                  <tr key={player.user_id} className="border-b last:border-0 dark:border-slate-700">
                    <td className="py-2 pr-4 text-gray-500 dark:text-gray-400">{index + 1}</td>
                    <td className="py-2 pr-4">
                      <Link
                        href={`/reports/players/${player.user_id}`}
                        className="font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                      >
                        {player.username}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums">{player.games_played.toLocaleString()}</td>
                    <td className="py-2 text-right tabular-nums">{player.games_finished.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {players.data.players.length === 0 && (
              <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                Nobody played this game in the selected range.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </ReportsShell>
  );
}
