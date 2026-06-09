'use client';

import type { ChipKey } from '@/components/user-hub/ActiveFilterChips';
import type { BoolParam, HubUser, SuspensionFilter, UserListFilters } from '@/types/user-hub';
import { LayoutGrid, List, Users } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { LoadingSpinner } from '@/components/loading-spinner';
import { LoginForm } from '@/components/login-form';
import { Navigation } from '@/components/navigation';
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
import { ActiveFilterChips } from '@/components/user-hub/ActiveFilterChips';
import { AdminGate } from '@/components/user-hub/AdminGate';
import { UserCard } from '@/components/user-hub/UserCard';
import { UserDetailSheet } from '@/components/user-hub/UserDetailSheet';
import { UserHubNav } from '@/components/user-hub/UserHubNav';
import { UserTable } from '@/components/user-hub/UserTable';
import { UserTableSkeleton } from '@/components/user-hub/UserTableSkeleton';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useFavouritesUsage } from '@/hooks/use-favourites-usage';
import { USER_LIST_PAGE_SIZE, useUserList } from '@/hooks/use-user-list';
import { useAuth } from '@/lib/auth';
import { readFilters, serialiseFilters } from '@/lib/user-hub-filters';
import { prettySlug } from '@/lib/user-hub-format';

const ORDERING_OPTIONS = [
  { value: 'id', label: 'ID (oldest)' },
  { value: '-id', label: 'ID (newest)' },
  { value: 'username', label: 'Username (A–Z)' },
  { value: '-username', label: 'Username (Z–A)' },
  { value: '-date_joined', label: 'Newest joined' },
  { value: '-last_login', label: 'Recently active' },
];

/** `undefined` → the "all" sentinel shadcn Select needs; and back. */
const ALL = 'all';

function UserHubUsersInner() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const isAdmin = isAuthenticated && !!user?.is_superuser;

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const filters = useMemo(
    () => readFilters(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );

  // Search box stays local for snappy typing; the debounced value is what we
  // write to the URL (avoids history spam).
  const [q, setQ] = useState(filters.search ?? '');
  const debouncedQ = useDebouncedValue(q, 300);

  const [view, setView] = useState<'cards' | 'table'>('table');
  const [selected, setSelected] = useState<HubUser | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const writeFilters = useCallback(
    (next: UserListFilters) => {
      const qs = serialiseFilters(next);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  // Patch a facet and reset to page 1 (the result set changed).
  const updateFilter = useCallback(
    (patch: Partial<UserListFilters>) => {
      writeFilters({ ...filters, ...patch, page: 1 });
    },
    [filters, writeFilters],
  );

  // Sync the debounced search term into the URL when it diverges.
  useEffect(() => {
    const next = debouncedQ.trim() || undefined;
    if (next !== filters.search) {
      writeFilters({ ...filters, search: next, page: 1 });
    }
    // Only react to debounced input; filters/writeFilters are stable enough here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  const { users, count, totalPages, isLoading: listLoading, error } = useUserList(isAdmin, filters);

  // Favourite-game picker options come from the analytics payload (games that
  // have ≥1 favourite). Degrades gracefully if that endpoint isn't deployed.
  const { data: favData } = useFavouritesUsage(isAdmin);
  const gameOptions = useMemo(
    () => (favData ? Object.keys(favData.game_popularity).sort() : []),
    [favData],
  );

  if (isLoading) {
    return <LoadingSpinner message="Authenticating" subtitle="Verifying staff access..." />;
  }
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  function handleSelect(u: HubUser) {
    setSelected(u);
    setSheetOpen(true);
  }

  function clearChip(key: ChipKey) {
    updateFilter({ [key]: undefined });
  }

  function clearAll() {
    setQ('');
    writeFilters({ ordering: filters.ordering, page: 1 });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 dark:from-slate-800 dark:to-emerald-900/30">
      <div className="mx-auto max-w-7xl space-y-6">
        <Navigation />

        <div className="space-y-2 text-center">
          <h1 className="flex items-center justify-center gap-2 text-3xl font-bold text-gray-900 dark:text-white">
            <Users className="size-7 text-emerald-600" />
            {' '}
            Users
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Search and filter users. Open a profile to view favourites and status. Read-only.
          </p>
        </div>

        {!isAdmin
          ? (
              <AdminGate />
            )
          : (
              <>
                <UserHubNav />

                <Card>
                  <CardContent className="grid grid-cols-1 gap-3 pt-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="sm:col-span-2 lg:col-span-1">
                      <label htmlFor="user-search" className="mb-1 block text-xs font-medium text-gray-600">Search</label>
                      <Input
                        id="user-search"
                        aria-label="Search users"
                        placeholder="Username, email or name…"
                        value={q}
                        onChange={e => setQ(e.target.value)}
                      />
                    </div>

                    <div>
                      <label htmlFor="filter-favourite" className="mb-1 block text-xs font-medium text-gray-600">Favourited game</label>
                      <Select
                        value={filters.favourite_game ?? ALL}
                        onValueChange={v => updateFilter({ favourite_game: v === ALL ? undefined : v })}
                      >
                        <SelectTrigger id="filter-favourite"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>Any game</SelectItem>
                          {gameOptions.map(slug => (
                            <SelectItem key={slug} value={slug}>{prettySlug(slug)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label htmlFor="filter-presence" className="mb-1 block text-xs font-medium text-gray-600">Presence</label>
                      <Select
                        value={filters.is_online ?? ALL}
                        onValueChange={v => updateFilter({ is_online: v === ALL ? undefined : (v as BoolParam) })}
                      >
                        <SelectTrigger id="filter-presence"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>All</SelectItem>
                          <SelectItem value="true">Online</SelectItem>
                          <SelectItem value="false">Offline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label htmlFor="filter-ordering" className="mb-1 block text-xs font-medium text-gray-600">Sort</label>
                      <Select value={filters.ordering ?? 'id'} onValueChange={v => updateFilter({ ordering: v })}>
                        <SelectTrigger id="filter-ordering"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ORDERING_OPTIONS.map(o => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label htmlFor="filter-suspension" className="mb-1 block text-xs font-medium text-gray-600">Suspension</label>
                      <Select
                        value={filters.suspension ?? ALL}
                        onValueChange={v => updateFilter({ suspension: v === ALL ? undefined : (v as SuspensionFilter) })}
                      >
                        <SelectTrigger id="filter-suspension"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>Any</SelectItem>
                          <SelectItem value="none">Not suspended</SelectItem>
                          <SelectItem value="any">Suspended</SelectItem>
                          <SelectItem value="FULL_PLATFORM">Full platform</SelectItem>
                          <SelectItem value="ALL_GAMES">All games</SelectItem>
                          <SelectItem value="MULTIPLAYER">Multiplayer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label htmlFor="filter-beta" className="mb-1 block text-xs font-medium text-gray-600">Beta</label>
                      <Select
                        value={filters.is_beta_tester ?? ALL}
                        onValueChange={v => updateFilter({ is_beta_tester: v === ALL ? undefined : (v as BoolParam) })}
                      >
                        <SelectTrigger id="filter-beta"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>All</SelectItem>
                          <SelectItem value="true">Beta testers</SelectItem>
                          <SelectItem value="false">Non-beta</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label htmlFor="filter-active" className="mb-1 block text-xs font-medium text-gray-600">Account</label>
                      <Select
                        value={filters.is_active ?? ALL}
                        onValueChange={v => updateFilter({ is_active: v === ALL ? undefined : (v as BoolParam) })}
                      >
                        <SelectTrigger id="filter-active"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL}>All</SelectItem>
                          <SelectItem value="true">Active</SelectItem>
                          <SelectItem value="false">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <ActiveFilterChips filters={filters} onRemove={clearChip} onClearAll={clearAll} />

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

                {error && (
                  <div
                    role="alert"
                    className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200"
                  >
                    {error}
                  </div>
                )}

                {listLoading
                  ? (
                      <UserTableSkeleton />
                    )
                  : !error && (
                      view === 'cards'
                        ? (
                            users.length === 0
                              ? (
                                  <div className="rounded-md border p-8 text-center text-sm text-gray-500">
                                    No users match your filters.
                                  </div>
                                )
                              : (
                                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                                    {users.map(u => <UserCard key={u.id} user={u} onSelect={handleSelect} />)}
                                  </div>
                                )
                          )
                        : (
                            <UserTable users={users} onSelect={handleSelect} />
                          )
                    )}

                <DataPagination
                  currentPage={filters.page ?? 1}
                  totalPages={totalPages}
                  totalCount={count}
                  visibleCount={users.length}
                  pageSize={USER_LIST_PAGE_SIZE}
                  onPageChange={p => writeFilters({ ...filters, page: p })}
                  disabled={listLoading}
                />
              </>
            )}

        <UserDetailSheet user={selected} open={sheetOpen} onOpenChange={setSheetOpen} />
      </div>
    </div>
  );
}

export default function UserHubUsersPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading" subtitle="Preparing the user list..." />}>
      <UserHubUsersInner />
    </Suspense>
  );
}
