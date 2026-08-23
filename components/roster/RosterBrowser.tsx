'use client';

import type { ReactNode } from 'react';
import type { FootballerNation } from '@/types/player';
import type {
  PaginatedGroupedPlayers,
  PaginatedPlayers,
  RoleFilter,
  RosterParams,
  StatusFilter,
  TeamPlayersOrdering,
  TransferFilter,
} from '@/types/team';
import { LayoutGrid, List } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { NationCombobox } from '@/components/footballer-management/NationCombobox';
import { GroupedPlayerTable } from '@/components/roster/GroupedPlayerTable';
import { PlayerCard } from '@/components/team-players/PlayerCard';
import { PlayerTable } from '@/components/team-players/PlayerTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { DataPagination } from '@/components/ui/data-pagination';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

const PAGE_SIZE = 50;

/**
 * A list of club stints, filtered and paged, whatever is being listed.
 *
 * A team's squad and a country's roster are the same rows scoped differently —
 * the backend says so too, where both are one view with one filter swapped. So
 * this holds the filters, the card/table toggle and the paging, and the pages
 * above it hold only what makes them different: which subject, and what to say
 * about it.
 *
 * The payoff is the boring kind. A filter added here appears on both pages, and
 * cannot be added to one and forgotten on the other — which would not break
 * anything, it would just silently not work on one page.
 *
 * The nationality picker is one of those: it was in the API from the start and
 * exposed nowhere, so "Brazilians at Chelsea" and "Brazilians who played in
 * England" both become reachable by putting it here once.
 */
export function RosterBrowser({ subjectId, fetchPage, header, emptyLabel, nationFilterLabel, onEditFootballer, onNationFilterChange, groupByFootballer }: {
  /** Null before a subject is chosen — the browser renders nothing. */
  subjectId: number | null;
  fetchPage: (subjectId: number, params: RosterParams) => Promise<PaginatedPlayers | PaginatedGroupedPlayers>;
  /** Rendered above the filters once a subject is loaded. */
  header?: ReactNode;
  emptyLabel?: string;
  /** What the nationality filter narrows here, for its label. */
  nationFilterLabel?: string;
  /** Opens a footballer in the edit form. Both pages want it. */
  onEditFootballer?: (footballerId: number) => void;
  /**
   * The nationality now filtering the list, so the page above can say what it
   * is showing — "Brazilian footballers who played in England" rather than a
   * heading that goes on claiming to show everyone.
   */
  onNationFilterChange?: (nation: FootballerNation | null) => void;
  /**
   * One row per person, each opening onto their clubs, rather than one row per
   * spell. A country's roster wants it — someone can have played for eleven
   * clubs there — and it makes the row count match what the analytics tile
   * counts. A squad does not: the spells at ONE club are the answer there.
   */
  groupByFootballer?: boolean;
}) {
  const [players, setPlayers] = useState<PaginatedPlayers | PaginatedGroupedPlayers | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [role, setRole] = useState<RoleFilter>('player');
  const [transferType, setTransferType] = useState<TransferFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [nationId, setNationId] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q, 300);
  const [ordering, setOrdering] = useState<TeamPlayersOrdering>('-start_year');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'cards' | 'table'>('table');

  useEffect(() => {
    if (subjectId === null) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPage(subjectId, {
      role,
      transfer_type: transferType,
      status: statusFilter,
      nation_id: nationId ?? undefined,
      group_by: groupByFootballer ? 'footballer' : undefined,
      q: debouncedQ.trim() || undefined,
      ordering,
      page,
      page_size: PAGE_SIZE,
    })
      .then((res) => {
        if (!cancelled) {
          setPlayers(res);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load players');
        setPlayers(null);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
    // `fetchPage` is rebuilt by the page on every render, so it is deliberately
    // not a dependency — depending on it would refetch forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectId, role, transferType, statusFilter, nationId, debouncedQ, ordering, page, groupByFootballer]);

  // Anything that changes WHICH rows exist sends you back to page one. Page 12
  // of a four-row filter does not exist, and the backend would answer with an
  // empty list that reads as "nobody matches".
  useEffect(() => {
    setPage(1);
  }, [role, transferType, statusFilter, nationId, debouncedQ, ordering, subjectId]);

  // Whether what came BACK is grouped, not whether grouping was asked for.
  //
  // A backend that predates `group_by` ignores it — DRF does not reject unknown
  // query params — and answers with the ungrouped stint rows. Rendering those
  // through the grouped table read `total_apps` off a row that has none and
  // threw during render, which with no error boundary above it is a blank page
  // saying "This page couldn't load". The two repositories deploy
  // independently, so this is a state that happens, not a hypothetical.
  const grouped = useMemo(() => {
    if (!groupByFootballer || players === null) {
      return false;
    }
    const [first] = players.results;
    return first === undefined || 'spell_count' in first;
  }, [groupByFootballer, players]);

  const totalPages = useMemo(() => {
    if (!players) {
      return 1;
    }
    return Math.max(1, Math.ceil(players.count / PAGE_SIZE));
  }, [players]);

  if (subjectId === null) {
    return null;
  }

  return (
    <div className="space-y-6">
      {header}

      {error && (
        <div
          role="alert"
          className="whitespace-pre-line rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
        >
          {error}
        </div>
      )}

      <Card>
        <CardContent className="grid grid-cols-1 gap-3 pt-6 md:grid-cols-2 lg:grid-cols-6">
          {/* First, and on both pages. The question people actually arrive with
              is "Brazilians who played in England", and that is this crossed
              with the subject above it. */}
          <div className="lg:col-span-2">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              {nationFilterLabel ?? 'Nationality'}
            </span>
            <NationCombobox
              value={nationId}
              onChange={(id, nation) => {
                setNationId(id);
                onNationFilterChange?.(nation);
              }}
              onClear={() => {
                setNationId(null);
                onNationFilterChange?.(null);
              }}
            />
          </div>

          <div>
            <label htmlFor="filter-role" className="mb-1 block text-xs font-medium text-muted-foreground">Role</label>
            <Select value={role} onValueChange={v => setRole(v as RoleFilter)}>
              <SelectTrigger id="filter-role"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="player">Players</SelectItem>
                <SelectItem value="manager">Managers</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="filter-transfer" className="mb-1 block text-xs font-medium text-muted-foreground">Transfer</label>
            <Select value={transferType} onValueChange={v => setTransferType(v as TransferFilter)}>
              <SelectTrigger id="filter-transfer"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
                <SelectItem value="loan">Loan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="filter-status" className="mb-1 block text-xs font-medium text-muted-foreground">Status</label>
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger id="filter-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="filter-sort" className="mb-1 block text-xs font-medium text-muted-foreground">Sort</label>
            <Select value={ordering} onValueChange={v => setOrdering(v as TeamPlayersOrdering)}>
              <SelectTrigger id="filter-sort"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="-start_year">Start year (newest)</SelectItem>
                <SelectItem value="start_year">Start year (oldest)</SelectItem>
                <SelectItem value="full_name">Name (A–Z)</SelectItem>
                <SelectItem value="-full_name">Name (Z–A)</SelectItem>
                <SelectItem value="-apps">Most apps</SelectItem>
                <SelectItem value="-goals">Most goals</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-1 lg:col-span-2">
            <label htmlFor="filter-player-name" className="mb-1 block text-xs font-medium text-muted-foreground">
              Player name
            </label>
            <Input
              id="filter-player-name"
              placeholder="Filter by name…"
              value={q}
              onChange={e => setQ(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Not rendered rather than hidden: grouped rows have no card view, and
          a control that does nothing should not be in the page at all — for a
          screen reader least of all. */}
      {!grouped && (
        <div className="flex items-center justify-end">
          <div className="flex gap-1">
            <Button size="sm" variant={view === 'cards' ? 'default' : 'outline'} onClick={() => setView('cards')} aria-label="Card view">
              <LayoutGrid className="size-4" />
            </Button>
            <Button size="sm" variant={view === 'table' ? 'default' : 'outline'} onClick={() => setView('table')} aria-label="Table view">
              <List className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {loading && !players && (
        <p className="text-center text-sm text-muted-foreground">Loading…</p>
      )}

      {players && (
        <>
          {grouped
            ? (
                <GroupedPlayerTable
                  players={(players as PaginatedGroupedPlayers).results}
                  emptyLabel={emptyLabel}
                />
              )
            : view === 'cards'
              ? (
                  (players as PaginatedPlayers).results.length === 0
                    ? (
                        <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
                          {emptyLabel ?? 'No players match the current filters.'}
                        </div>
                      )
                    : (
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {(players as PaginatedPlayers).results.map(player => (
                            <PlayerCard key={player.id} player={player} onEdit={onEditFootballer} />
                          ))}
                        </div>
                      )
                )
              : <PlayerTable players={(players as PaginatedPlayers).results} onEdit={onEditFootballer} />}

          <DataPagination
            currentPage={page}
            totalPages={totalPages}
            totalCount={players.count}
            visibleCount={players.results.length}
            onPageChange={setPage}
            disabled={loading}
          />
        </>
      )}
    </div>
  );
}
