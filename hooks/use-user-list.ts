/**
 * Loads the admin user list with server-side search, ordering and pagination
 * (DRF `?search=` / `?ordering=` / `?page=`). Page size is fixed by the BE
 * (PageNumberPagination, PAGE_SIZE=10) — we read `count` to derive totalPages.
 */

import type { HubUser } from '@/types/user-hub';
import { useCallback, useEffect, useState } from 'react';
import { UserHubAPI } from '@/lib/user-hub-api';

/** BE PageNumberPagination default (extratime/settings.py PAGE_SIZE). */
export const USER_LIST_PAGE_SIZE = 10;

export type UseUserList = {
  users: HubUser[];
  count: number;
  totalPages: number;
  page: number;
  setPage: (page: number) => void;
  search: string;
  setSearch: (q: string) => void;
  ordering: string;
  setOrdering: (o: string) => void;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

export function useUserList(isAuthenticated: boolean, debouncedSearch: string): UseUserList {
  const [users, setUsers] = useState<HubUser[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [ordering, setOrdering] = useState('id');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await UserHubAPI.listUsers({
        search: debouncedSearch.trim() || undefined,
        ordering,
        page,
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
  }, [debouncedSearch, ordering, page]);

  useEffect(() => {
    if (isAuthenticated) {
      load();
    }
  }, [isAuthenticated, load]);

  // Reset to page 1 whenever the result set narrows.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, ordering]);

  const totalPages = Math.max(1, Math.ceil(count / USER_LIST_PAGE_SIZE));

  return {
    users,
    count,
    totalPages,
    page,
    setPage,
    search,
    setSearch,
    ordering,
    setOrdering,
    isLoading,
    error,
    refetch: load,
  };
}
