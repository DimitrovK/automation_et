'use client';

import type { RangeState } from '@/lib/report-range';
import { useMemo } from 'react';
import { EmptyState } from '@/components/reports/EmptyState';
import { ExportButton } from '@/components/reports/ExportButton';
import { FilterBar } from '@/components/reports/FilterBar';
import { GameBadge } from '@/components/reports/GameBadge';
import { ModeBreakdown } from '@/components/reports/ModeBreakdown';
import { MultiplayerFunnel } from '@/components/reports/MultiplayerFunnel';
import { RangePicker } from '@/components/reports/RangePicker';
import { ReportPanel } from '@/components/reports/ReportPanel';
import { ReportsShell } from '@/components/reports/ReportsShell';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/ReportTable';
import { StatTile } from '@/components/reports/StatTile';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { gameName, useGameMeta } from '@/hooks/use-game-meta';
import { useReport } from '@/hooks/use-report';
import { useReportFilters } from '@/hooks/use-report-filters';
import { useAuth } from '@/lib/auth';
import { rangeToParams } from '@/lib/report-range';
import { ReportsAPI } from '@/lib/reports-api';

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
  const state = useReport(
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
      <FilterBar>
        <RangePicker
          value={range}
          onChange={setRange}
          includeBots={includeBots}
          onIncludeBotsChange={setIncludeBots}
        />

      </FilterBar>
      {game && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-900/20">
          <span className="text-sm text-foreground/80">Filtered to</span>
          <GameBadge gameKey={game} meta={meta} active onClick={() => setGame(null)} />
        </div>
      )}

      <div className="flex justify-end">
        <ExportButton
          rows={state.data?.by_game ?? []}
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

      <ReportPanel state={state} skeletonClassName="h-64 w-full">
        {data => (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: 'Rooms created', value: data.totals.rooms_created },
                { label: 'Started', value: data.totals.rooms_started },
                { label: 'Finished', value: data.totals.rooms_finished },
                { label: 'Cancelled', value: data.totals.rooms_cancelled },
              ].map(tile => (
                <StatTile key={tile.label} label={tile.label} value={tile.value.toLocaleString()} />
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
                <ReportTable>
                  <ReportHead>
                    <Th>Game</Th>
                    <Th align="right">Created</Th>
                    <Th align="right">Started</Th>
                    <Th align="right">Finished</Th>
                    <Th align="right">Cancelled</Th>
                    <Th align="right">Never started</Th>
                  </ReportHead>
                  <tbody>
                    {data.by_game.map(row => (
                      <ReportRow key={row.game_type}>
                        <Td strong>
                          {gameName(meta[row.game_type], row.game_type)}
                        </Td>
                        <Td align="right">{row.rooms_created.toLocaleString()}</Td>
                        <Td align="right">{row.rooms_started.toLocaleString()}</Td>
                        <Td align="right">{row.rooms_finished.toLocaleString()}</Td>
                        <Td align="right">{row.rooms_cancelled.toLocaleString()}</Td>
                        <Td align="right">
                          {row.never_started_pct}
                          %
                        </Td>
                      </ReportRow>
                    ))}
                  </tbody>
                </ReportTable>
                {data.by_game.length === 0 && (
                  <EmptyState>
                    No multiplayer rooms in this window.
                  </EmptyState>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </ReportPanel>
    </ReportsShell>
  );
}
