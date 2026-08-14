'use client';

import type { RangeState } from '@/lib/report-range';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '@/components/reports/EmptyState';
import { ExportButton } from '@/components/reports/ExportButton';
import { FilterBar, FilterGroup, Segmented } from '@/components/reports/FilterBar';
import { GameBadge } from '@/components/reports/GameBadge';
import { PlayStyleBadge } from '@/components/reports/PlayStyleBadge';
import { RangePicker } from '@/components/reports/RangePicker';
import { ReportPanel } from '@/components/reports/ReportPanel';
import { ReportsShell } from '@/components/reports/ReportsShell';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/ReportTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGameMeta } from '@/hooks/use-game-meta';
import { useReport } from '@/hooks/use-report';
import { useReportFilters } from '@/hooks/use-report-filters';
import { useAuth } from '@/lib/auth';
import { playStyle } from '@/lib/play-style';
import { rangeToParams } from '@/lib/report-range';
import { ReportsAPI } from '@/lib/reports-api';
import { cn } from '@/lib/utils';

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
  // Syncing the draft when the URL-derived value changes is the point: a shared
  // link or a Back navigation must land in the box. A one-way sync from a value
  // this component does not own, not a render loop.
  // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
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
  const state = useReport(
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
      <FilterBar>
        <RangePicker
          value={range}
          onChange={setRange}
          includeBots={includeBots}
          onIncludeBotsChange={setIncludeBots}
        />

        <FilterGroup label="Find a player" hint="Narrows who is counted, not who survives the ranking — searching a quiet player still finds them.">
          <div className="flex items-center gap-1.5">
            <Input
              id="player-search"
              aria-label="Find a player by username"
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
          </div>
        </FilterGroup>

        {/* A dropdown, not three buttons. Row count is a single choice from a
            closed set, which is what a select is for — and three more filled/
            outlined buttons beside the range presets made it read as another
            filter rather than a page size. 100 is the API's own cap. */}
        <FilterGroup label="Rows">
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
        </FilterGroup>

        <FilterGroup label="Rank by">
          <Segmented>
            {([['played', 'Played'], ['finished', 'Finished']] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={sortBy === key}
                onClick={() => setSortBy(key)}
                className={cn(
                  'rounded px-2.5 py-1 text-sm font-medium transition-colors',
                  sortBy === key
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {label}
              </button>
            ))}
          </Segmented>
        </FilterGroup>
      </FilterBar>

      {game && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-900/20">
          <span className="text-sm text-foreground/80">Filtered to</span>
          <GameBadge gameKey={game} meta={meta} active onClick={() => setGame(null)} />
        </div>
      )}

      <div className="flex justify-end">
        <ExportButton
          rows={state.data?.players ?? []}
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

      <ReportPanel state={state} skeletonClassName="h-96 w-full">
        {data => (
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
              <ReportTable>
                <ReportHead>
                  <Th>#</Th>
                  <Th>Player</Th>
                  <Th align="right">Played</Th>
                  <Th align="right">Finished</Th>
                  <Th>Style</Th>
                  <Th>Games</Th>
                </ReportHead>
                <tbody>
                  {data.players.map((player, index) => (
                    <ReportRow key={player.user_id}>
                      <Td className="text-muted-foreground">{index + 1}</Td>
                      <Td className="font-medium">
                        {/* The drill-down existed and worked; nothing linked
                            to it, so the only way in was typing a URL. */}
                        <Link
                          href={`/reports/players/${player.user_id}`}
                          className="text-emerald-700 hover:underline dark:text-emerald-400"
                        >
                          {player.username}
                        </Link>
                      </Td>
                      <Td align="right">{player.games_played.toLocaleString()}</Td>
                      <Td align="right">{player.games_finished.toLocaleString()}</Td>
                      <Td>
                        <PlayStyleBadge played={player.games_played} mp={player.mp_sessions} />
                      </Td>
                      <Td>
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
                      </Td>
                    </ReportRow>
                  ))}
                </tbody>
              </ReportTable>
              {data.players.length === 0 && (
                <EmptyState>
                  {search
                    ? `No player matching "${search}" played in this window.`
                    : 'Nobody played in this window.'}
                </EmptyState>
              )}
            </CardContent>
          </Card>
        )}
      </ReportPanel>
    </ReportsShell>
  );
}
