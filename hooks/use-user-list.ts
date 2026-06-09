/**
 * Loads the admin user list for a given filter set (server-side search,
 * faceted filters, ordering, pagination). The page owns the filter state (and
 * syncs it to the URL); this hook is a thin fetcher. Page size is fixed by the
 * BE (PageNumberPagination, PAGE_SIZE=10) — we read `count` to derive totalPages.
 */

import type { HubUser, UserListFilters } from '@/types/user-hub';
import { useCallback, useEffect, useState } from 'react';
import { UserHubAPI } from '@/lib/user-hub-api';

/** BE PageNumberPagination default (extratime/settings.py PAGE_SIZE). */
export const USER_LIST_PAGE_SIZE = 10;

export type UseUserList = {
  users: HubUser[];
  count: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useUserList(isAuthenticated: boolean, filters: UserListFilters): UseUserList {
  const [users, setUsers] = useState<HubUser[]>([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Serialize the filter object so the effect re-runs on any value change
  // without depending on referential identity of the caller's object.
  const filterKey = JSON.stringify(filters);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await UserHubAPI.listUsers({
        ...filters,
        search: filters.search?.trim() || undefined,
      });
      setUsers(res.results);
      setCount(res.count ?? 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
      setUsers([]);
      setCount(0);
    } finally {
      setIsLoading(false);
    }
    // filterKey captures every filter value; `filters` itself is intentionally
    // not a dep (it's a fresh object each render).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  useEffect(() => {
    if (isAuthenticated) {
      load();
    }
  }, [isAuthenticated, load]);

  const totalPages = Math.max(1, Math.ceil(count / USER_LIST_PAGE_SIZE));

  return { users, count, totalPages, isLoading, error, refetch: load };
}
