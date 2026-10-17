'use client';

import type { RangeState } from '@/lib/report-range';
import type { Granularity } from '@/types/reports';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { GAME_CONTENT } from '@/components/games/GameContent';
import { InsightsShell } from '@/components/insights/InsightsShell';
import { ActivityChart } from '@/components/reports/charts/ActivityChart';
import { DurationHistogram } from '@/components/reports/charts/DurationHistogram';
import { GameHourProfile } from '@/components/reports/charts/GameHourProfile';
import { ComparePicker } from '@/components/reports/filters/ComparePicker';
import { FilterBar } from '@/components/reports/filters/FilterBar';
import { RangePicker } from '@/components/reports/filters/RangePicker';
import { AttemptSpread } from '@/components/reports/panels/AttemptSpread';
import { ComparisonTiles } from '@/components/reports/panels/ComparisonTiles';
import { ContentHealth } from '@/components/reports/panels/ContentHealth';
import { DifficultyOutcomes } from '@/components/reports/panels/DifficultyOutcomes';
import { DurationTable } from '@/components/reports/panels/DurationTable';
import { GameRetentionCard } from '@/components/reports/panels/GameRetentionCard';
import { ProgressDropOff } from '@/components/reports/panels/ProgressDropOff';
import { UnfinishedTable } from '@/components/reports/panels/UnfinishedTable';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { Fold, PanelCard } from '@/components/reports/primitives/PanelCard';
import { ReportError } from '@/components/reports/primitives/ReportError';
import { ReportPanel } from '@/components/reports/primitives/ReportPanel';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/primitives/ReportTable';
import { SectionHeader } from '@/components/reports/primitives/SectionHeader';
import { StatTile } from '@/components/reports/primitives/StatTile';
import { Skeleton } from '@/components/ui/skeleton';
import { gameName, useGameColor, useGameMeta } from '@/hooks/use-game-meta';
import { useReport } from '@/hooks/use-report';
import { useReportFilters } from '@/hooks/use-report-filters';
import { useAuth } from '@/lib/auth';
import { compareToParams, rangeToParams } from '@/lib/report-range';
import { ReportsAPI } from '@/lib/reports-api';

/**
 * Everything about one game, in Grid's three sections: is it healthy, is its
 * content good, who plays it.
 *
 * It replaces /reports/games/<key> (behaviour) and the separate content pages
 * (Career Path, Lineups), which split one game over two sections with tabs
 * between them. The game's own content cards come from GAME_CONTENT; every game
 * also gets its rows of the cross-game cards (difficulty, attempts, drop-off,
 * stock, unfinished). Grid keeps its own richer page at /games/grid.
 */
export default function GameDetailPage() {
  // Server-side bucketing: a week's distinct players is computed, not
  // summed, so changing this refetches rather than regrouping.
  const [granularity, setGranularity] = useState<Granularity>('day');
  const resolveColor = useGameColor();
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);
  const routeParams = useParams();
  const router = useRouter();
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
  // Wait for the game list, and fetch nothing for a key that isn't a game: a
  // mistyped URL used to fire ten requests that all answered 400.
  const metaLoaded = Object.keys(meta).length > 0;
  const knownGame = !!meta[gameKey];
  const ready = enabled && !!gameKey && knownGame;
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

  // Game-filtered where the endpoint takes it; the snapshot endpoints (stock,
  // unfinished) answer for every game and are narrowed to this one's rows.
  const difficulty = useReport(ReportsAPI.getDifficulty, params, ready, 'The difficulty reporting endpoint');
  const attempts = useReport(ReportsAPI.getAttempts, params, ready, 'The wrong-attempts reporting endpoint');
  const progress = useReport(ReportsAPI.getProgress, params, ready, 'The in-session progress endpoint');
  const content = useReport(ReportsAPI.getContent, {}, ready, 'The content reporting endpoint');
  const unfinished = useReport(
    () => ReportsAPI.getUnfinished(includeBots),
    useMemo(() => ({ include_bots: includeBots }), [includeBots]),
    ready,
    'The unfinished-sessions endpoint',
  );
  const contentParams = useMemo(() => ({ ...rangeToParams(range), include_bots: includeBots }), [range, includeBots]);

  const label = gameName(meta[gameKey], gameKey);
  const ownContent = GAME_CONTENT[gameKey];
  const games = Object.values(meta).sort((a, b) => gameName(a, a.key).localeCompare(gameName(b, b.key)));
  const row = summary.data?.by_game.find(entry => entry.game_type === gameKey);

  if (enabled && metaLoaded && !knownGame) {
    return (
      <InsightsShell title="Game not found" description="There is no game with this address.">
        <EmptyState hint="Pick a game from the list.">
          <Link href="/reports/games" className="text-primary hover:underline">All games</Link>
        </EmptyState>
      </InsightsShell>
    );
  }

  return (
    <InsightsShell
      title={label}
      description="Is it healthy, is its content good, and who plays it."
    >
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Link href="/reports/games" className="text-primary hover:underline">All games</Link>
        <span aria-hidden className="text-muted-foreground">/</span>
        {/* A switcher instead of "find the badge in a table": every game is one
            pick away, and the filters in the URL come along. */}
        <select
          aria-label="Game"
          value={gameKey}
          onChange={event => router.push(`/games/${event.target.value}${globalThis.location?.search ?? ''}`)}
          className="h-8 rounded-md border bg-background px-2 text-sm font-medium"
        >
          {games.length === 0 && <option value={gameKey}>{label}</option>}
          {games.map(game => <option key={game.key} value={game.key}>{gameName(game, game.key)}</option>)}
        </select>
      </div>

      <FilterBar>
        <RangePicker
          value={range}
          onChange={setRange}
          includeBots={includeBots}
          onIncludeBotsChange={setIncludeBots}
        />
      </FilterBar>

      <SectionHeader title="Health" description="How much it is played, how often it is finished, and whether people return." />

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
                      metric="completion_pct"
                      value={row.completion_pct === null ? '—' : `${row.completion_pct}%`}
                      hint="Of games started"
                    />
                    <StatTile
                      label="Came back"
                      metric="repeat_rate_pct"
                      value={row.repeat_rate_pct === null ? '—' : `${row.repeat_rate_pct}%`}
                      hint="Players who came back another day"
                    />
                    <StatTile
                      label="Sessions per player"
                      metric="sessions_per_player"
                      value={row.sessions_per_player?.toString() ?? '—'}
                    />
                    <StatTile
                      label="Share of platform"
                      metric="share_pct"
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

      <Fold id={`game-${gameKey}-when`} title="When and how long" summary="Time of day and session length">
        <ReportPanel state={patterns} skeletonClassName="h-40 w-full">
          {data => ((data.by_hour ?? []).some(hour => hour.games_started > 0)
            ? <GameHourProfile data={data} gameLabel={label} />
            : <EmptyState>No sessions in this window.</EmptyState>)}
        </ReportPanel>
        <ReportPanel state={duration} skeletonClassName="h-64 w-full">
          {data => (
            <>
              <DurationTable data={data} meta={meta} />
              <DurationHistogram data={data} meta={meta} />
            </>
          )}
        </ReportPanel>
      </Fold>

      <SectionHeader title="Content" description="How hard it plays, where sessions stop, and whether there is material left." />

      {ownContent && (
        <Fold id={`game-${gameKey}-content`} title={ownContent.title} summary={ownContent.summary} defaultOpen>
          {ownContent.render({ params: contentParams, enabled: ready })}
        </Fold>
      )}

      <Fold id={`game-${gameKey}-plays`} title="How it plays" summary="Difficulty, wrong attempts and where sessions stop">
        <ReportPanel state={difficulty} skeletonClassName="h-64 w-full">
          {data => <DifficultyOutcomes data={data} meta={meta} />}
        </ReportPanel>
        <ReportPanel state={attempts} skeletonClassName="h-56 w-full">
          {data => <AttemptSpread data={data} meta={meta} />}
        </ReportPanel>
        <ReportPanel state={progress} skeletonClassName="h-64 w-full">
          {data => <ProgressDropOff data={data} meta={meta} />}
        </ReportPanel>
      </Fold>

      <Fold id={`game-${gameKey}-material`} title="Material left" summary="Content stock and unfinished sessions (today, not windowed)">
        <ReportPanel state={content} skeletonClassName="h-48 w-full">
          {data => (!data.rows.some(entry => entry.game_type === gameKey)
            ? <EmptyState>This game has no content pool to run low.</EmptyState>
            : (
                <ContentHealth
                  meta={meta}
                  data={{
                    ...data,
                    rows: data.rows.filter(entry => entry.game_type === gameKey),
                    games_running_low: data.games_running_low.filter(key => key === gameKey),
                  }}
                />
              ))}
        </ReportPanel>
        <ReportPanel state={unfinished} skeletonClassName="h-48 w-full">
          {data => (
            <UnfinishedTable
              rows={data.rows.filter(entry => entry.game_type === gameKey)}
              meta={meta}
              asOf={data.as_of}
              totalStale={data.rows.filter(entry => entry.game_type === gameKey).reduce((sum, entry) => sum + entry.stale_sessions, 0)}
            />
          )}
        </ReportPanel>
      </Fold>

      <SectionHeader title="Players" description="Who plays it and whether they come back. These follow the date range." />

      <Fold id={`game-${gameKey}-retention`} title="Retention" summary="Does it keep its new players, against the other games">
        <ReportPanel state={retention} skeletonClassName="h-64 w-full">
          {data => (data.by_game?.some(row => row.game_type === gameKey)
            ? <GameRetentionCard data={data} gameKey={gameKey} gameLabel={label} />
            : <EmptyState>No new players of this game in the window to follow.</EmptyState>)}
        </ReportPanel>
      </Fold>

      <ReportPanel state={players} skeletonClassName="h-16 w-full">
        {data => (
          <PanelCard
            id={`game-${gameKey}-top-players`}
            title="Top players"
            summary={data.players[0] ? `${data.players[0].username} leads with ${data.players[0].games_played.toLocaleString()} games` : undefined}
            description="Ranked within this game only."
            contentClassName="overflow-x-auto"
          >
            {data.players.length === 0
              ? <EmptyState>Nobody played this game in the selected range.</EmptyState>
              : (
                  <ReportTable>
                    <ReportHead>
                      <Th>#</Th>
                      <Th>Player</Th>
                      <Th align="right">Played</Th>
                      <Th align="right">Finished</Th>
                    </ReportHead>
                    <tbody>
                      {data.players.map((player, index) => (
                        <ReportRow key={player.user_id}>
                          <Td className="text-muted-foreground">{index + 1}</Td>
                          <Td>
                            <Link href={`/reports/players/${player.user_id}`} className="font-medium text-primary hover:underline">
                              {player.username}
                            </Link>
                          </Td>
                          <Td align="right">{player.games_played.toLocaleString()}</Td>
                          <Td align="right">{player.games_finished.toLocaleString()}</Td>
                        </ReportRow>
                      ))}
                    </tbody>
                  </ReportTable>
                )}
          </PanelCard>
        )}
      </ReportPanel>
    </InsightsShell>
  );
}
