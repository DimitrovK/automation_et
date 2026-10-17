'use client';

import type { BoardOption, GridPopulationFilters } from '@/components/analytics/grid/GridFilters';
import type { GridGroupBy, GridSplit } from '@/hooks/use-report-filters';
import type { RangeState } from '@/lib/report-range';
import type { Granularity, GridModeRow, GridParams } from '@/types/reports';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ActiveFilterChips } from '@/components/analytics/ActiveFilterChips';
import { GridBreakdown } from '@/components/analytics/grid/GridBreakdown';
import { GridFilters } from '@/components/analytics/grid/GridFilters';
import { GridMultiplayer } from '@/components/analytics/grid/GridMultiplayer';
import { GridHealthTiles, GridSessionsChart } from '@/components/analytics/grid/GridSessionsChart';
import { modeLabel } from '@/components/analytics/panels/grid-mode';
import { GridAssists } from '@/components/analytics/panels/GridAssists';
import { GridCriteria } from '@/components/analytics/panels/GridContent';
import { GridPool } from '@/components/analytics/panels/GridPool';
import { GridPools } from '@/components/analytics/panels/GridPools';
import { TopPlayersCard } from '@/components/games/TopPlayersCard';
import { InsightsShell } from '@/components/insights/InsightsShell';
import { DurationHistogram } from '@/components/reports/charts/DurationHistogram';
import { GameHourProfile } from '@/components/reports/charts/GameHourProfile';
import { FilterBar } from '@/components/reports/filters/FilterBar';
import { RangePicker } from '@/components/reports/filters/RangePicker';
import { DurationTable } from '@/components/reports/panels/DurationTable';
import { GameRetentionCard } from '@/components/reports/panels/GameRetentionCard';
import { Fold } from '@/components/reports/primitives/PanelCard';
import { ReportPanel } from '@/components/reports/primitives/ReportPanel';
import { SectionHeader } from '@/components/reports/primitives/SectionHeader';
import { StatTile } from '@/components/reports/primitives/StatTile';
import { useGameMeta } from '@/hooks/use-game-meta';
import { useReport } from '@/hooks/use-report';
import { useReportFilters } from '@/hooks/use-report-filters';
import { useAuth } from '@/lib/auth';
import { rangeToParams } from '@/lib/report-range';
import { ReportsAPI } from '@/lib/reports-api';

const PLAY_LABEL = { all: null, solo: 'Solo', multiplayer: 'Multiplayer' } as const;
// Fallbacks until the first answer: the real names come from Grid settings (labels).
const MODE_LABEL: Record<string, string> = { HOME: 'Classic', ABROAD: 'Reversed' };
const REVEAL_LABEL: Record<string, string> = { INSTANT: 'Instant', FINAL: 'Final Whistle' };

/**
 * Grid, in one place: is it healthy, is the content good, who plays it.
 *
 * It replaces /reports/games/grid and /analytics/grid, which overlapped and
 * disagreed (one counted multiplayer, the other did not, and the same page
 * showed both). One filter bar decides which sessions the page is about, and
 * every card follows it: a card that can't (stock, retention) says so in its
 * description. Detail is folded away so the page reads top to bottom as
 * headlines first.
 */
export default function GridDashboardPage() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);
  const [granularity, setGranularity] = useState<Granularity>('day');

  const { filters, update } = useReportFilters({
    range: { window: 30 },
    includeBots: false,
    game: null,
    metric: 'games_started',
  });
  const {
    range,
    includeBots,
    gridDifficulty,
    gridRoster,
    gridSize,
    gridPlayType,
    gridBoard,
    gridVariationMode,
    gridReveal,
    gridSplit,
    gridGroupBy,
  } = filters;

  const population: GridPopulationFilters = {
    playType: gridPlayType,
    board: gridBoard,
    variationMode: gridVariationMode,
    reveal: gridReveal,
  };
  const setPopulation = (patch: Partial<GridPopulationFilters>) => update({
    ...('playType' in patch ? { gridPlayType: patch.playType } : {}),
    ...('board' in patch ? { gridBoard: patch.board } : {}),
    ...('variationMode' in patch ? { gridVariationMode: patch.variationMode } : {}),
    ...('reveal' in patch ? { gridReveal: patch.reveal } : {}),
  });

  const rangeParams = useMemo(
    () => ({ ...rangeToParams(range), include_bots: includeBots }),
    [range, includeBots],
  );
  const populationParams: GridParams = useMemo(() => ({
    ...rangeParams,
    play_type: gridPlayType,
    ...(gridBoard ? { board: gridBoard } : {}),
    // The global board has no country mode: a mode left over in the URL is never applied there.
    ...(gridVariationMode && gridBoard !== 'global' ? { variation_mode: gridVariationMode } : {}),
    ...(gridReveal ? { reveal: gridReveal } : {}),
  }), [rangeParams, gridPlayType, gridBoard, gridVariationMode, gridReveal]);

  // Boards the window actually played, for the Board filter: unfiltered by the
  // population so picking a board never empties its own list.
  const boardList = useReport(
    ReportsAPI.getGridSessions,
    useMemo(() => ({ ...rangeParams, split: 'board' }), [rangeParams]),
    enabled,
    'The Grid sessions endpoint',
  );
  const sessions = useReport(
    ReportsAPI.getGridSessions,
    useMemo(() => ({ ...populationParams, split: gridSplit, granularity }), [populationParams, gridSplit, granularity]),
    enabled,
    'The Grid sessions endpoint',
  );
  const content = useReport(
    ReportsAPI.getGridAnalytics,
    useMemo(() => ({
      ...populationParams,
      group_by: gridGroupBy === 'mode' ? 'board' : gridGroupBy,
      ...(gridDifficulty ? { difficulty: gridDifficulty } : {}),
      ...(gridRoster ? { footballer_status: gridRoster } : {}),
      ...(gridSize ? { grid_size: gridSize } : {}),
    }), [populationParams, gridGroupBy, gridDifficulty, gridRoster, gridSize]),
    enabled,
    'The Grid analytics endpoint',
  );
  const gridOnly = useMemo(() => ({ ...rangeParams, game_type: 'grid' }), [rangeParams]);
  const { meta } = useGameMeta(enabled);
  const patterns = useReport(ReportsAPI.getPatterns, gridOnly, enabled, 'The patterns reporting endpoint');
  const duration = useReport(ReportsAPI.getDuration, gridOnly, enabled, 'The duration reporting endpoint');
  // Unfiltered on purpose: the card reads Grid's row against the other games' median.
  const retention = useReport(ReportsAPI.getRetention, rangeParams, enabled, 'The retention reporting endpoint');
  const players = useReport(
    ReportsAPI.getTopPlayers,
    useMemo(() => ({ ...gridOnly, limit: 10 }), [gridOnly]),
    enabled,
    'The top-players reporting endpoint',
  );

  const boards: BoardOption[] = boardList.data?.series_keys ?? [];
  const boardName = (key: string) => key === 'global' ? 'Global' : boards.find(b => b.key === key)?.label ?? `Board #${key}`;
  const selectedMode = gridDifficulty || gridRoster || gridSize ? `${gridDifficulty}|${gridRoster}|${gridSize}` : null;
  const selectMode = (row: GridModeRow | null) => update(row
    ? { gridDifficulty: row.difficulty, gridRoster: row.footballer_status, gridSize: row.grid_size }
    : { gridDifficulty: null, gridRoster: null, gridSize: null });
  const modeLabels = { ...MODE_LABEL, ...boardList.data?.labels?.variation_mode };
  const revealLabels = { ...REVEAL_LABEL, ...boardList.data?.labels?.reveal };
  const newPlayers = patterns.data?.new_vs_returning?.reduce((sum, day) => sum + day.new_players, 0);
  const gridRetention = retention.data?.by_game?.find(row => row.game_type === 'grid');
  const d7 = gridRetention?.d7;

  return (
    <InsightsShell
      title="Grid"
      description="Is Grid healthy, is its content good, and who plays it. Health and Content follow the filters; a card that can't says so."
      actions={<Link href="/reports/glossary" className="text-sm text-muted-foreground hover:text-foreground hover:underline">What the numbers mean</Link>}
    >
      <FilterBar>
        <RangePicker
          value={range}
          onChange={(next: RangeState) => update({ range: next })}
          includeBots={includeBots}
          onIncludeBotsChange={(next: boolean) => update({ includeBots: next })}
        />
        <GridFilters value={population} onChange={setPopulation} boards={boards} modeLabels={modeLabels} revealLabels={revealLabels} />
      </FilterBar>

      <ActiveFilterChips
        chips={[
          ...(PLAY_LABEL[gridPlayType] ? [{ key: 'play', kind: 'Play type', label: PLAY_LABEL[gridPlayType]!, onClear: () => setPopulation({ playType: 'all' }) }] : []),
          ...(gridBoard ? [{ key: 'board', kind: 'Board', label: boardName(gridBoard), onClear: () => setPopulation({ board: null }) }] : []),
          ...(gridVariationMode ? [{ key: 'country_mode', kind: 'Country mode', label: modeLabels[gridVariationMode] ?? gridVariationMode, onClear: () => setPopulation({ variationMode: null }) }] : []),
          ...(gridReveal ? [{ key: 'timing', kind: 'Timing', label: revealLabels[gridReveal] ?? gridReveal, onClear: () => setPopulation({ reveal: null }) }] : []),
          ...(selectedMode
            ? [{
                key: 'mode',
                kind: 'Mode',
                label: modeLabel({ difficulty: gridDifficulty, footballer_status: gridRoster ?? 'BOTH', grid_size: gridSize ?? '' } as GridModeRow),
                onClear: () => selectMode(null),
              }]
            : []),
        ]}
      />

      <SectionHeader title="Health" description="How much Grid is played, and which way." />

      <ReportPanel state={sessions} skeletonClassName="h-28 w-full">
        {data => <GridHealthTiles tiles={data.tiles} previous={data.previous} />}
      </ReportPanel>

      <ReportPanel state={sessions} skeletonClassName="h-96 w-full">
        {data => (
          <GridSessionsChart
            data={data}
            split={gridSplit}
            onSplitChange={(split: GridSplit) => update({ gridSplit: split })}
            granularity={granularity}
            onGranularityChange={setGranularity}
          />
        )}
      </ReportPanel>

      <Fold id="grid-when-and-how-long" title="When and how long" summary="Time of day and session length · all Grid play">
        <ReportPanel state={patterns} skeletonClassName="h-40 w-full">
          {data => <GameHourProfile data={data} gameLabel="Grid" />}
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

      <SectionHeader title="Content" description="Which modes play well, which criteria and footballers mislead, and whether the pools are stocked." />

      <ReportPanel state={content} skeletonClassName="h-72 w-full">
        {data => (
          <GridBreakdown
            data={data}
            groupBy={gridGroupBy}
            onGroupByChange={(groupBy: GridGroupBy) => update({ gridGroupBy: groupBy })}
            selectedKey={selectedMode}
            onSelectMode={selectMode}
            groupLoading={content.isLoading}
          />
        )}
      </ReportPanel>

      <ReportPanel state={content} skeletonClassName="h-16 w-full">
        {data => <GridCriteria data={data} />}
      </ReportPanel>
      <ReportPanel state={content} skeletonClassName="h-16 w-full">
        {data => <GridPool data={data} />}
      </ReportPanel>
      <ReportPanel state={content} skeletonClassName="h-16 w-full">
        {data => <GridAssists data={data} />}
      </ReportPanel>
      <ReportPanel state={content} skeletonClassName="h-16 w-full">
        {data => <GridPools data={data} initialBoard={gridBoard} />}
      </ReportPanel>

      <SectionHeader title="Multiplayer" description="Grid rooms: whether lobbies become games, who stays to the whistle, and how VAR and Peek are spent." />

      <ReportPanel state={content} skeletonClassName="h-48 w-full">
        {data => <GridMultiplayer data={data.multiplayer} />}
      </ReportPanel>

      <SectionHeader title="Players" description="Who plays Grid and whether they come back. These follow the date range only: they are about people, not one way of playing." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile
          label="New players"
          value={newPlayers === undefined ? '—' : newPlayers.toLocaleString()}
          hint="First Grid game in the window"
        />
        <StatTile
          label="Back within 7 days"
          value={d7?.pct === null || d7?.pct === undefined ? '—' : `${d7.pct}%`}
          hint={d7 ? `${d7.returned.toLocaleString()} of ${d7.players.toLocaleString()} new Grid players` : 'Not enough new players yet'}
        />
        <StatTile label="Top player's games" value={players.data?.players[0] ? players.data.players[0].games_played.toLocaleString() : '—'} hint={players.data?.players[0]?.username} />
      </div>

      <Fold id="grid-retention" title="Retention" summary={d7 ? `${d7.pct ?? '—'}% back within 7 days` : undefined}>
        <ReportPanel state={retention} skeletonClassName="h-64 w-full">
          {data => <GameRetentionCard data={data} gameKey="grid" gameLabel="Grid" />}
        </ReportPanel>
      </Fold>

      <ReportPanel state={players} skeletonClassName="h-16 w-full">
        {data => <TopPlayersCard id="grid-top-players" data={data} description="Busiest players of Grid in the date range, with how much of it was in rooms." />}
      </ReportPanel>
    </InsightsShell>
  );
}
