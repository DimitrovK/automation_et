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
import { EmptyState } from '@/components/reports/EmptyState';
import { FilterBar } from '@/components/reports/FilterBar';
import { GameHourProfile } from '@/components/reports/GameHourProfile';
import { GameRetentionCard } from '@/components/reports/GameRetentionCard';
import { RangePicker } from '@/components/reports/RangePicker';
import { ReportError } from '@/components/reports/ReportError';
import { ReportsShell } from '@/components/reports/ReportsShell';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/ReportTable';
import { StatTile } from '@/components/reports/StatTile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useGameColor, useGameMeta } from '@/hooks/use-game-meta';
import { useReport } from '@/hooks/use-report';
import { useReportFilters } from '@/hooks/use-report-filters';
import { useAuth } from '@/lib/auth';
import { compareToParams, rangeToParams } from '@/lib/report-range';
import { ReportsAPI } from '@/lib/reports-api';

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
        {/* /reports is the Daily Pulse, not the games list — "All games" went to
            the wrong page, which is easy to miss because both are plausible
            destinations from here. */}
        <Link
          href="/reports/games"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="size-4" />
          All games
        </Link>
      </div>

      <FilterBar>
        <RangePicker
          value={range}
          onChange={setRange}
          includeBots={includeBots}
          onIncludeBotsChange={setIncludeBots}
        />
      </FilterBar>

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
                    <StatTile
                      label="Completion"
                      value={row.completion_pct === null ? '—' : `${row.completion_pct}%`}
                      hint="Of games started"
                    />
                    <StatTile
                      label="Repeat rate"
                      value={row.repeat_rate_pct === null ? '—' : `${row.repeat_rate_pct}%`}
                      hint="Players who came back another day"
                    />
                    <StatTile
                      label="Sessions per player"
                      value={row.sessions_per_player?.toString() ?? '—'}
                    />
                    <StatTile
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
            <ReportTable>
              <ReportHead>
                <Th>#</Th>
                <Th>Player</Th>
                <Th align="right">Played</Th>
                <Th align="right">Finished</Th>
              </ReportHead>
              <tbody>
                {players.data.players.map((player, index) => (
                  <ReportRow key={player.user_id}>
                    <Td className="text-muted-foreground">{index + 1}</Td>
                    <Td>
                      <Link
                        href={`/reports/players/${player.user_id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {player.username}
                      </Link>
                    </Td>
                    <Td align="right">{player.games_played.toLocaleString()}</Td>
                    <Td align="right">{player.games_finished.toLocaleString()}</Td>
                  </ReportRow>
                ))}
              </tbody>
            </ReportTable>
            {players.data.players.length === 0 && (
              <EmptyState>
                Nobody played this game in the selected range.
              </EmptyState>
            )}
          </CardContent>
        </Card>
      )}
    </ReportsShell>
  );
}
