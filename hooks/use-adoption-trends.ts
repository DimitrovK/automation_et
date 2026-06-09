/**
 * Loads favourites adoption-over-time. Owns the day/week granularity. Degrades
 * gracefully (notDeployed) when the BE endpoint isn't live yet.
 */

import type { AdoptionTrendsResponse, TrendGranularity } from '@/types/user-hub';
import { useCallback, useEffect, useState } from 'react';
import config from '@/lib/config';
import { UserHubAPI } from '@/lib/user-hub-api';

export type UseAdoptionTrends = {
  data: AdoptionTrendsResponse | null;
  isLoading: boolean;
  error: string | null;
  notDeployed: boolean;
  granularity: TrendGranularity;
  setGranularity: (g: TrendGranularity) => void;
  refetch: () => void;
};

export function useAdoptionTrends(isAuthenticated: boolean): UseAdoptionTrends {
  const [data, setData] = useState<AdoptionTrendsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notDeployed, setNotDeployed] = useState(false);
  const [granularity, setGranularity] = useState<TrendGranularity>('day');

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNotDeployed(false);
    try {
      setData(await UserHubAPI.getAdoptionTrends(granularity));
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : 'Failed to load adoption trends';
      const is404 = /404|Not Found/i.test(raw);
      setNotDeployed(is404);
      setError(
        is404
          ? `The adoption-trends endpoint isn't available at ${config.API_BASE_URL} yet (GET /accounts/admin/favourites-trends/). This populates automatically once its backend PR is live.`
          : raw,
      );
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [granularity]);

  useEffect(() => {
    if (isAuthenticated) {
      load();
    }
  }, [isAuthenticated, load]);

  return { data, isLoading, error, notDeployed, granularity, setGranularity, refetch: load };
}
