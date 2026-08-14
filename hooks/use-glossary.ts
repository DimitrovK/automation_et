/**
 * Metric definitions from the BE registry that sits beside the queries.
 *
 * Deliberately no local fallback copy: a stale duplicate is the exact failure
 * this endpoint exists to remove. If the glossary can't be fetched, the UI says
 * so rather than showing definitions that may no longer match the maths.
 *
 * The request is shared at module scope because a page can hold many of these —
 * the games table alone has one per sortable column — and each hook instance
 * firing its own request would turn a page render into a burst of identical
 * calls for data that never changes within a session.
 */

import type { GlossaryResponse, MetricDefinition } from '@/types/reports';
import { useEffect, useState } from 'react';
import { ReportsAPI } from '@/lib/reports-api';

export type GlossaryState = {
  metrics: MetricDefinition[];
  byKey: Record<string, MetricDefinition>;
  isLoading: boolean;
  failed: boolean;
};

let inFlight: Promise<GlossaryResponse> | null = null;

function fetchGlossaryOnce(): Promise<GlossaryResponse> {
  if (!inFlight) {
    inFlight = ReportsAPI.getGlossary().catch((error) => {
      // Clear on failure so a later mount can retry; keeping a rejected promise
      // would make one transient error permanent for the session.
      inFlight = null;
      throw error;
    });
  }
  return inFlight;
}

/** Test seam — resets the shared request between cases. */
export function resetGlossaryCache() {
  inFlight = null;
}

export function useGlossary(enabled = true): GlossaryState {
  const [metrics, setMetrics] = useState<MetricDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let cancelled = false;
    // The fetch starts here, so the loading flag starts here too. Deriving it
    // during render would mean rendering a request that has not been made.
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setIsLoading(true);
    fetchGlossaryOnce()
      .then((res) => {
        if (!cancelled) {
          setMetrics(res.metrics);
          setFailed(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return {
    metrics,
    byKey: Object.fromEntries(metrics.map(metric => [metric.key, metric])),
    isLoading,
    failed,
  };
}
