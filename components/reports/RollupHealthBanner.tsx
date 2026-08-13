'use client';

import type { RollupHealth } from '@/types/reports';
import { AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ReportsAPI } from '@/lib/reports-api';

/**
 * Says when the numbers below can't be trusted, and what to run about it.
 *
 * Every report already flags coverage for its own window. This answers the
 * different question — is the rollup itself complete — and it only appears when
 * the answer is no. A banner that is always present is one people stop reading,
 * which would make it worse than nothing.
 *
 * One day behind is the normal state between nightly runs, not a problem, so it
 * stays silent for that.
 */
const NORMAL_LAG_DAYS = 1;

export function RollupHealthBanner() {
  const [health, setHealth] = useState<RollupHealth | null>(null);

  useEffect(() => {
    let cancelled = false;
    ReportsAPI.getRollupHealth()
      .then((data) => {
        if (!cancelled) {
          setHealth(data);
        }
      })
      // A failure here must not take the page down: the reports are still
      // readable, we simply can't vouch for the rollup behind them.
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!health) {
    return null;
  }

  const stale = health.stale_days ?? 0;
  const unhealthy = !health.has_data || health.gap_count > 0 || stale > NORMAL_LAG_DAYS;
  if (!unhealthy) {
    return null;
  }

  const problem = !health.has_data
    ? 'The reporting rollup has never been computed, so every figure below is unknown rather than zero.'
    : health.gap_count > 0
      ? `${health.gap_count} day${health.gap_count === 1 ? '' : 's'} inside the covered range were never computed, so any window including them is incomplete.`
      : `The rollup is ${stale} days behind, so recent days read as quiet rather than uncounted.`;

  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-900/20">
      <p className="flex items-start gap-2 font-medium text-amber-900 dark:text-amber-100">
        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
        {problem}
      </p>
      {health.suggested_command && (
        <pre className="mt-2 overflow-x-auto rounded bg-amber-100/70 p-2 text-xs text-amber-950 dark:bg-slate-900/60 dark:text-amber-100">
          {health.suggested_command}
        </pre>
      )}
      {health.has_data && (
        <p className="mt-2 text-xs text-amber-800 dark:text-amber-200">
          {/* What IS covered, so the warning above is bounded rather than
              alarming — a three-day gap in ninety is a different problem from
              three days being all there is. */}
          Covering
          {' '}
          {health.earliest}
          {' → '}
          {health.latest}
          {` (${health.days_covered} days computed).`}
        </p>
      )}

      {health.gaps_truncated && (
        <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
          Showing the first missing days only — the command above spans them all.
        </p>
      )}
    </div>
  );
}
