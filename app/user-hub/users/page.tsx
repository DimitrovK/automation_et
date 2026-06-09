'use client';

import type { HubUser } from '@/types/user-hub';
import { LayoutGrid, List, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
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
import { AdminGate } from '@/components/user-hub/AdminGate';
import { UserCard } from '@/components/user-hub/UserCard';
import { UserDetailSheet } from '@/components/user-hub/UserDetailSheet';
import { UserHubNav } from '@/components/user-hub/UserHubNav';
import { UserTable } from '@/components/user-hub/UserTable';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { USER_LIST_PAGE_SIZE, useUserList } from '@/hooks/use-user-list';
import { useAuth } from '@/lib/auth';

const ORDERING_OPTIONS: { value: string; label: string }[] = [
  { value: 'id', label: 'ID (oldest)' },
  { value: '-id', label: 'ID (newest)' },
  { value: 'username', label: 'Username (A–Z)' },
  { value: '-username', label: 'Username (Z–A)' },
  { value: 'email', label: 'Email (A–Z)' },
];

export default function UserHubUsersPage() {
  const { isLoading, isAuthenticated, user } = useAuth();
  const isAdmin = isAuthenticated && !!user?.is_superuser;

  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q, 300);
  const [view, setView] = useState<'cards' | 'table'>('table');
  const [presence, setPresence] = useState<'all' | 'online' | 'offline'>('all');
  const [selected, setSelected] = useState<HubUser | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const {
    users,
    count,
    totalPages,
    page,
    setPage,
    ordering,
    setOrdering,
    isLoading: listLoading,
    error,
  } = useUserList(isAdmin, debouncedQ);

  // Presence isn't server-filterable (is_online is Redis-derived, not a DB
  // field), so this narrows the current page client-side.
  const visibleUsers = useMemo(() => {
    if (presence === 'all') {
      return users;
    }
    return users.filter(u => (presence === 'online' ? u.is_online === true : u.is_online === false));
  }, [users, presence]);

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
            Search users and open a profile to view favourites, rankings and status. Read-only.
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
                  <CardContent className="grid grid-cols-1 gap-3 pt-6 md:grid-cols-4">
                    <div className="md:col-span-2">
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
                      <label htmlFor="user-presence" className="mb-1 block text-xs font-medium text-gray-600">Presence</label>
                      <Select value={presence} onValueChange={v => setPresence(v as 'all' | 'online' | 'offline')}>
                        <SelectTrigger id="user-presence"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="online">Online</SelectItem>
                          <SelectItem value="offline">Offline</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label htmlFor="user-ordering" className="mb-1 block text-xs font-medium text-gray-600">Sort</label>
                      <Select value={ordering} onValueChange={setOrdering}>
                        <SelectTrigger id="user-ordering"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {ORDERING_OPTIONS.map(o => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
                {presence !== 'all' && (
                  <p className="-mt-3 text-center text-xs text-gray-500">
                    Presence filter applies to the current page only (online status isn't
                    server-side filterable yet).
                  </p>
                )}

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

                {listLoading && <p className="text-center text-sm text-gray-500">Loading users…</p>}

                {!listLoading && !error && (
                  view === 'cards'
                    ? (
                        visibleUsers.length === 0
                          ? (
                              <div className="rounded-md border p-8 text-center text-sm text-gray-500">
                                No users match your search.
                              </div>
                            )
                          : (
                              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                                {visibleUsers.map(u => <UserCard key={u.id} user={u} onSelect={handleSelect} />)}
                              </div>
                            )
                      )
                    : (
                        <UserTable users={visibleUsers} onSelect={handleSelect} />
                      )
                )}

                <DataPagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalCount={count}
                  visibleCount={users.length}
                  pageSize={USER_LIST_PAGE_SIZE}
                  onPageChange={setPage}
                  disabled={listLoading}
                />
              </>
            )}

        <UserDetailSheet user={selected} open={sheetOpen} onOpenChange={setSheetOpen} />
      </div>
    </div>
  );
}
