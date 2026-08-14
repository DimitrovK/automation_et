/**
 * Generic loader for the Reports endpoints.
 *
 * Mirrors `use-favourites-usage`, including its "not deployed yet" handling: the
 * BE endpoints ship in their own PRs, so a 404 gets a friendly explanation
 * rather than a raw error the reader can't act on.
 */

import type { ReportParams } from '@/types/reports';
import { useCallback, useEffect, useRef, useState } from 'react';
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
  /**
   * Identity of the thing being fetched, when it isn't captured by `params` —
   * e.g. the user id on the player drill-down, which lives in the path. Changing
   * it refetches. Omitting it can only ever cause a missed refetch, never a loop.
   */
  resourceKey: string = '',
): UseReport<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notDeployed, setNotDeployed] = useState(false);

  // Params are rebuilt on each render by callers; key on the values so the
  // effect doesn't refetch forever on an identical object.
  const key = JSON.stringify(params);

  // The fetcher is invoked through a ref and deliberately NOT an effect
  // dependency. Callers that bind an argument (`p => getPlayerDetail(id, p)`)
  // produce a new function every render, which made the effect refire, set
  // state, re-render and request forever — ~2,000 calls in 400ms, in
  // production. Refetching is driven by `key` and `resourceKey` instead, both
  // values rather than identities, so an unmemoised fetcher can't spin.
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setNotDeployed(false);
    try {
      setData(await fetcherRef.current(paramsRef.current));
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
    // `key` and `resourceKey` are not read inside this callback, and the rule
    // is right that they are unnecessary for correctness of its BODY. They are
    // here to control its IDENTITY: the effect below depends on `load`, so a
    // new key produces a new `load` and therefore a refetch. That indirection
    // is what stopped the loop this hook was built to fix — the fetcher itself
    // is deliberately not a dependency, because callers rebuild it every
    // render. Removing these two would leave nothing to trigger a refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, resourceKey, endpointLabel]);

  useEffect(() => {
    if (enabled) {
      load();
    }
  }, [enabled, load]);

  return { data, isLoading, error, notDeployed, refetch: load };
}
