'use client';

import { LayoutGrid, List, Users2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { LoadingSpinner } from '@/components/loading-spinner';
import { LoginForm } from '@/components/login-form';
import { Navigation } from '@/components/navigation';
import { PlayerCard } from '@/components/team-players/PlayerCard';
import { PlayerTable } from '@/components/team-players/PlayerTable';
import { TeamHeader } from '@/components/team-players/TeamHeader';
import { TeamSearch } from '@/components/team-players/TeamSearch';
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
import { useAuth } from '@/lib/auth';
import config from '@/lib/config';
import { TeamAPI } from '@/lib/team-api';
import type {
  RoleFilter,
  StatusFilter,
  TeamPlayersOrdering,
  TeamPlayersResponse,
  TransferFilter,
} from '@/types/team';

const PAGE_SIZE = 50;

export default function TeamPlayersPage() {
  const { isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // ---- selected team + payload ------------------------------------------
  const [teamId, setTeamId] = useState<number | null>(null);
  const [data, setData] = useState<TeamPlayersResponse | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ---- filters / view ----------------------------------------------------
  const [role, setRole] = useState<RoleFilter>('player');
  const [transferType, setTransferType] = useState<TransferFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q, 300);
  const [ordering, setOrdering] = useState<TeamPlayersOrdering>('-start_year');
  const [page, setPage] = useState(1);
  const [view, setView] = useState<'cards' | 'table'>('table');

  // ---- effects -----------------------------------------------------------
  useEffect(() => {
    if (teamId === null) return;
    let cancelled = false;
    setDataLoading(true);
    setError(null);
    TeamAPI.getTeamPlayers(teamId, {
      role,
      transfer_type: transferType,
      status: statusFilter,
      q: debouncedQ.trim() || undefined,
      ordering,
      page,
      page_size: PAGE_SIZE,
    })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const raw = err instanceof Error ? err.message : 'Failed to load team players';
        // 404 from this endpoint means one of two things:
        //  1. The team id genuinely doesn't exist in the DB.
        //  2. The backend hasn't deployed the new
        //     /data/team/<id>/players/ route yet — common during the
        //     period between PR review and the prod deploy.
        const friendly = /404|Not Found|Team not found/i.test(raw)
          ? `${raw}\n\nThis can mean the team id doesn't exist, or the backend at ${config.API_BASE_URL} doesn't have the team-players endpoint deployed yet (GET /data/team/<id>/players/).`
          : raw;
        setError(friendly);
        setData(null);
      })
      .finally(() => {
        if (!cancelled) setDataLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [teamId, role, transferType, statusFilter, debouncedQ, ordering, page]);

  // Reset to page 1 whenever any filter that narrows the result set changes.
  useEffect(() => {
    setPage(1);
  }, [role, transferType, statusFilter, debouncedQ, ordering, teamId]);

  // ---- derived -----------------------------------------------------------
  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.players.count / PAGE_SIZE));
  }, [data]);

  // ---- guards ------------------------------------------------------------
  if (isLoading) {
    return <LoadingSpinner message="Authenticating" subtitle="Verifying staff access..." />;
  }
  if (!isAuthenticated) return <LoginForm />;

  // ---- handlers ----------------------------------------------------------
  function handleTeamSelect(id: number) {
    setTeamId(id);
    setError(null);
  }

  function handleEditFootballer(footballerId: number) {
    router.push(`/footballer-management?edit=${footballerId}`);
  }

  // ---- render ------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 dark:from-slate-800 dark:to-emerald-900/30">
      <div className="mx-auto max-w-7xl space-y-6">
        <Navigation />

        <div className="space-y-2 text-center">
          <h1 className="flex items-center justify-center gap-2 text-3xl font-bold text-gray-900 dark:text-white">
            <Users2 className="size-7 text-emerald-600" /> Team Players
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Look up the squad assigned to a team. Search by name or paste a team ID.
          </p>
        </div>

        <TeamSearch onSelect={handleTeamSelect} onValidationError={setError} />

        {/* Error / loading / result */}
        {error && (
          <div
            role="alert"
            className="whitespace-pre-line rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
          >
            {error}
          </div>
        )}

        {dataLoading && <p className="text-center text-sm text-gray-500">Loading team…</p>}

        {data && (
          <>
            <TeamHeader team={data.team} />

            {/* Filters */}
            <Card>
              <CardContent className="grid grid-cols-1 gap-3 pt-6 md:grid-cols-2 lg:grid-cols-6">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Role</label>
                  <Select value={role} onValueChange={(v) => setRole(v as RoleFilter)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="player">Players</SelectItem>
                      <SelectItem value="manager">Managers</SelectItem>
                      <SelectItem value="all">All</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Transfer</label>
                  <Select
                    value={transferType}
                    onValueChange={(v) => setTransferType(v as TransferFilter)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="permanent">Permanent</SelectItem>
                      <SelectItem value="loan">Loan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
                  <Select
                    value={statusFilter}
                    onValueChange={(v) => setStatusFilter(v as StatusFilter)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-1 lg:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Player name
                  </label>
                  <Input
                    aria-label="Filter by player name"
                    placeholder="Filter by name…"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Sort</label>
                  <Select
                    value={ordering}
                    onValueChange={(v) => setOrdering(v as TeamPlayersOrdering)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
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
              </CardContent>
            </Card>

            {/* View toggle (count is rendered with the paginator below) */}
            <div className="flex items-center justify-end">
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={view === 'cards' ? 'default' : 'outline'}
                  onClick={() => setView('cards')}
                  aria-label="Card view"
                >
                  <LayoutGrid className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant={view === 'table' ? 'default' : 'outline'}
                  onClick={() => setView('table')}
                  aria-label="Table view"
                >
                  <List className="size-4" />
                </Button>
              </div>
            </div>

            {/* Results */}
            {view === 'cards' ? (
              data.players.results.length === 0 ? (
                <div className="rounded-md border p-8 text-center text-sm text-gray-500">
                  No players match the current filters.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {data.players.results.map((p) => (
                    <PlayerCard key={p.id} player={p} onEdit={handleEditFootballer} />
                  ))}
                </div>
              )
            ) : (
              <PlayerTable players={data.players.results} onEdit={handleEditFootballer} />
            )}

            <DataPagination
              currentPage={page}
              totalPages={totalPages}
              totalCount={data.players.count}
              visibleCount={data.players.results.length}
              onPageChange={setPage}
              disabled={dataLoading}
            />
          </>
        )}
      </div>
    </div>
  );
}
