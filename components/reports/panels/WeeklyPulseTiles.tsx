'use client';

import type { WeeklyPulse } from '@/types/reports';
import { MetricInfo } from '@/components/reports/primitives/MetricInfo';
import { cn } from '@/lib/utils';

/**
 * The pulse at the scale the platform actually supports.
 *
 * Leads over the daily tiles because a day is not a meaningful sample here: at
 * 36 players on a game, one day moves by four people and reads as a 30% swing.
 * The daily pulse is still below — "what happened today" is a real question,
 * just not the one to open with.
 *
 * Complete days only, which removes a doubt the daily figure cannot: that one
 * has to scale its baseline by how much of today has elapsed, and every number
 * on it is therefore partial until midnight.
 */

/**
 * The tiles, in the order they are read — not in whatever order the API happens
 * to serialise its keys (Copilot on #124). `PulseTiles` already does this;
 * iterating `Object.entries` here meant a backend key reordering silently
 * reordered the UI.
 */
const TILES: { metric: string; label: string }[] = [
  { metric: 'games_started', label: 'Games started' },
  { metric: 'games_finished', label: 'Games finished' },
  { metric: 'distinct_players', label: 'Players' },
  { metric: 'mp_player_sessions', label: 'Multiplayer sessions' },
];

function Delta({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span className="text-xs text-muted-foreground/70" title="Not every day in the baseline was computed, so there is nothing to compare against">
        no baseline
      </span>
    );
  }
  const flat = Math.abs(value) < 0.05;
  return (
    <span
      className={cn(
        'text-xs font-medium',
        flat
          ? 'text-muted-foreground'
          : value > 0
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-red-600 dark:text-red-400',
      )}
    >
      {flat ? 'level' : `${value > 0 ? '+' : ''}${value}%`}
    </span>
  );
}

export function WeeklyPulseTiles({ pulse }: { pulse: WeeklyPulse }) {
  return (
    <section aria-label="This week">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {TILES.filter(tile => pulse.metrics[tile.metric]).map(({ metric, label }) => {
          const values = pulse.metrics[metric];
          return (
            <div key={metric} className="rounded-lg border bg-card p-3">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {label}
                <MetricInfo metric={metric} />
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {values.current.toLocaleString()}
              </p>
              <p className="mt-0.5 flex items-baseline gap-1.5">
                <Delta value={values.delta_pct} />
                {values.baseline !== null && (
                  <span className="text-xs text-muted-foreground">
                    {`vs ${values.baseline.toLocaleString()} usual`}
                  </span>
                )}
              </p>
            </div>
          );
        })}
      </div>

      <p className="mt-2 text-center text-xs text-muted-foreground">
        {`${pulse.start} to ${pulse.end} — seven finished days, against the mean of the ${pulse.baseline_weeks} weeks before. `}
        {pulse.baseline_covered
          ? 'Today is deliberately left out: it is not over.'
          // Not a silent zero. Averaging over days the rollup never computed
          // divides real activity by four and calls the result typical.
          : 'Some days in the baseline were never computed, so the comparison is withheld rather than averaged over gaps.'}
      </p>
    </section>
  );
}
