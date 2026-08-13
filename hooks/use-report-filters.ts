/**
 * Keeps the report filters in the URL, so a view can be bookmarked, shared or
 * reloaded without losing what you had selected.
 *
 * Uses history.replaceState rather than Next's useSearchParams on purpose: these
 * pages are statically prerendered, and useSearchParams forces them into
 * client-side bailout unless every one is wrapped in Suspense. The filters are
 * a client-only concern — nothing server-rendered reads them — so the simpler
 * mechanism is also the correct one here.
 *
 * replaceState, not pushState: changing a filter shouldn't stack history entries
 * that make Back walk through every toggle instead of leaving the page.
 */

import type { RangeState } from '@/lib/report-range';
import type { MetricKey, ReportWindow } from '@/types/reports';
import { useCallback, useEffect, useState } from 'react';
import { REPORT_WINDOWS } from '@/types/reports';

export type ReportFilters = {
  range: RangeState;
  includeBots: boolean;
  game: string | null;
  metric: MetricKey;
  /** Rows on the leaderboard views. Bounded by the API's own cap. */
  limit: number;
  /** Username fragment on the players view. Empty means no filter, not "match nothing". */
  search: string;
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** MAX_LIMIT in core/reporting_views.py — a larger value is rejected with a 400. */
const MAX_LIMIT = 100;

/** Only the leaderboard views paginate, so the rest never mention a limit. */
const DEFAULT_LIMIT = 25;

function parse(search: string, fallback: ReportFilters): ReportFilters {
  const params = new URLSearchParams(search);

  const rawWindow = Number(params.get('window'));
  const window = REPORT_WINDOWS.includes(rawWindow as ReportWindow)
    ? (rawWindow as ReportWindow)
    : fallback.range.window;

  const start = params.get('start');
  const end = params.get('end');
  // A start without a valid shape is ignored rather than passed on — the API
  // would 400, and a shared link with a typo should degrade to the default view
  // rather than to an error panel.
  const hasRange = !!start && ISO_DATE.test(start) && (!end || ISO_DATE.test(end));

  // Out-of-range or non-numeric limits fall back to the default rather than
  // being passed on: the API rejects them with a 400, and a shared link with a
  // typo should degrade to the default view rather than to an error panel.
  // Trimmed here as well as server-side: "  " in a shared link would otherwise
  // put the box in a filtered-looking state while matching everyone.
  const searchTerm = (params.get('search') ?? '').trim();

  const rawLimit = Number(params.get('limit'));
  const limit = Number.isInteger(rawLimit) && rawLimit >= 1 && rawLimit <= MAX_LIMIT
    ? rawLimit
    : fallback.limit;

  return {
    range: hasRange ? { window, start, end: end ?? undefined } : { window },
    includeBots: params.get('bots') === '1',
    game: params.get('game') || null,
    metric: (params.get('metric') as MetricKey) || fallback.metric,
    limit,
    search: searchTerm,
  };
}

function serialise(filters: ReportFilters, defaults: ReportFilters): string {
  const params = new URLSearchParams();
  if (filters.range.start) {
    params.set('start', filters.range.start);
    if (filters.range.end) {
      params.set('end', filters.range.end);
    }
  } else if (filters.range.window !== defaults.range.window) {
    params.set('window', String(filters.range.window));
  }
  if (filters.includeBots) {
    params.set('bots', '1');
  }
  if (filters.game) {
    params.set('game', filters.game);
  }
  // Only non-defaults go in the URL, so a shared link shows the filters that
  // were actually chosen instead of a wall of noise.
  if (filters.metric !== defaults.metric) {
    params.set('metric', filters.metric);
  }
  if (filters.limit !== defaults.limit) {
    params.set('limit', String(filters.limit));
  }
  // In the URL so "find this player" is a link someone can be sent.
  if (filters.search) {
    params.set('search', filters.search);
  }
  const query = params.toString();
  return query ? `?${query}` : '';
}

export function useReportFilters(
  // `limit` is optional: only the leaderboard views paginate, and requiring it
  // on the other seven pages would put a number in front of readers that means
  // nothing there.
  suppliedDefaults: Omit<ReportFilters, 'limit' | 'search'> & { limit?: number; search?: string },
) {
  const defaults: ReportFilters = { limit: DEFAULT_LIMIT, search: '', ...suppliedDefaults };
  const [filters, setFilters] = useState<ReportFilters>(defaults);
  const [hydrated, setHydrated] = useState(false);

  // Read once on mount, deliberately in an effect rather than a lazy initialiser.
  // These pages are statically prerendered, so a render-time read would produce
  // markup that disagrees with the server's and trip a hydration mismatch. The
  // rule below guards against cascading re-renders, which a one-shot mount read
  // is not.
  useEffect(() => {
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setFilters(parse(globalThis.location.search, defaults));
    // eslint-disable-next-line react-hooks-extra/no-direct-set-state-in-use-effect
    setHydrated(true);
    // Defaults are a literal at the call site; re-reading on every render would
    // clobber whatever the user just picked.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    const query = serialise(filters, defaults);
    globalThis.history.replaceState(null, '', `${globalThis.location.pathname}${query}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, hydrated]);

  const update = useCallback((patch: Partial<ReportFilters>) => {
    setFilters(current => ({ ...current, ...patch }));
  }, []);

  return { filters, update };
}

/** Exposed for tests: the pure half of this hook. */
export const __test = { parse, serialise };
