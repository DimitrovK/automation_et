/**
 * Generic loader for the Reports endpoints.
 *
 * Mirrors `use-favourites-usage`, including its "not deployed yet" handling: the
 * BE endpoints ship in their own PRs, so a 404 gets a friendly explanation
 * rather than a raw error the reader can't act on.
 */

import type { ReportParams } from '@/types/reports';
import { useCallback, useEffect, useMemo, useState } from 'react';
import config from '@/lib/config';

export type UseReport<T> = {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  /** True when the failure looks like "endpoint not deployed yet" (404). */
  notDeployed: boolean;
  refetch: () => void;
};

export function useReport<T>(
  fetcher: (params?: ReportParams) => Promise<T>,
  params: ReportParams,
  enabled: boolean,
  endpointLabel: string,
): UseReport<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notDeployed, setNotDeployed] = useState(false);

  // Params are rebuilt on each render by callers; key on the values so the
  // effect doesn't refetch forever on an identical object.
  const key = JSON.stringify(params);
  const stableParams = useMemo(() => params, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNotDeployed(false);
    try {
      setData(await fetcher(stableParams));
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : `Failed to load ${endpointLabel}`;
      const is404 = /404|Not Found/i.test(raw);
      setNotDeployed(is404);
      setError(
        is404
          ? `${endpointLabel} isn't available at ${config.API_BASE_URL} yet.\n\nIt deploys with its backend PR. This view will populate automatically once that's live.`
          : raw,
      );
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, stableParams, endpointLabel]);

  useEffect(() => {
    if (enabled) {
      load();
    }
  }, [enabled, load]);

  return { data, isLoading, error, notDeployed, refetch: load };
}
