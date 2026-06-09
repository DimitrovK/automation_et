/**
 * Loads favourited-vs-played engagement per game. Degrades gracefully
 * (notDeployed) when the BE endpoint isn't live yet.
 */

import type { FavouredVsPlayedResponse } from '@/types/user-hub';
import { useCallback, useEffect, useState } from 'react';
import config from '@/lib/config';
import { UserHubAPI } from '@/lib/user-hub-api';

export type UseFavouredVsPlayed = {
  data: FavouredVsPlayedResponse | null;
  isLoading: boolean;
  error: string | null;
  notDeployed: boolean;
  refetch: () => void;
};

export function useFavouredVsPlayed(isAuthenticated: boolean): UseFavouredVsPlayed {
  const [data, setData] = useState<FavouredVsPlayedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notDeployed, setNotDeployed] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNotDeployed(false);
    try {
      setData(await UserHubAPI.getFavouredVsPlayed());
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Failed to load engagement';
      const is404 = /404|Not Found/i.test(raw);
      setNotDeployed(is404);
      setError(
        is404
          ? `The favourited-vs-played endpoint isn't available at ${config.API_BASE_URL} yet (GET /accounts/admin/favourites-vs-played/). This populates automatically once its backend PR is live.`
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
