/**
 * Loads the admin favourites-usage analytics. Returns a friendly error when
 * the endpoint isn't deployed yet (it ships in a separate BE PR), so the
 * analytics page can degrade gracefully instead of crashing.
 */

import type { FavouritesUsageResponse } from '@/types/user-hub';
import { useCallback, useEffect, useState } from 'react';
import config from '@/lib/config';
import { UserHubAPI } from '@/lib/user-hub-api';

export type UseFavouritesUsage = {
  data: FavouritesUsageResponse | null;
  isLoading: boolean;
  /** Friendly, already-formatted message, or null. */
  error: string | null;
  /** True when the error looks like "endpoint not deployed yet" (404). */
  notDeployed: boolean;
  refetch: () => void;
};

export function useFavouritesUsage(isAuthenticated: boolean): UseFavouritesUsage {
  const [data, setData] = useState<FavouritesUsageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notDeployed, setNotDeployed] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNotDeployed(false);
    try {
      const res = await UserHubAPI.getFavouritesUsage();
      setData(res);
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Failed to load favourites usage';
      const is404 = /404|Not Found/i.test(raw);
      setNotDeployed(is404);
      setError(
        is404
          ? `The favourites-usage endpoint isn't available at ${config.API_BASE_URL} yet.\n\nIt deploys with its backend PR (GET /accounts/admin/favourites-usage/). This view will populate automatically once that's live.`
          : raw,
      );
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      load();
    }
  }, [isAuthenticated, load]);

  return { data, isLoading, error, notDeployed, refetch: load };
}
