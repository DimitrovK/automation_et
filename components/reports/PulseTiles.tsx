'use client';

import type { ActivityMetrics, Pulse, PulseMetric } from '@/types/reports';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const TILES: { key: keyof ActivityMetrics; label: string; hint: string }[] = [
  { key: 'games_started', label: 'Games started', hint: 'Sessions begun today' },
  { key: 'games_finished', label: 'Games finished', hint: 'Of those, played to the end' },
  { key: 'distinct_players', label: 'Players', hint: 'Distinct people who played' },
  { key: 'mp_player_sessions', label: 'Multiplayer', hint: 'Participations in rooms' },
];

/**
 * A delta is only meaningful against the same weekday — a games platform dips
 * hard at weekends, so "vs yesterday" would read as a crash every Monday. The BE
 * sends the mean of the last four same weekdays; we show the comparison against
 * that, and say so, rather than leaving the reader to guess the reference point.
 */
function Delta({ metric }: { metric: PulseMetric }) {
  if (metric.delta_pct_vs_baseline === null) {
    // Three genuinely different reasons, and saying which one matters: a missing
    // baseline is a data gap to fix, a zero baseline is real news.
    const reason = metric.baseline_same_weekday === null
      ? 'no baseline data'
      : metric.baseline_same_weekday === 0
        ? 'new — no usual level'
        : 'no comparison';
    return (
      <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
        <Minus className="size-3" />
        {reason}
      </span>
    );
  }

  const pct = metric.delta_pct_vs_baseline;
  const flat = Math.abs(pct) < 5;
  const up = pct > 0;
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        'flex items-center gap-1 text-xs font-medium',
        flat
          ? 'text-gray-500 dark:text-gray-400'
          : up
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-red-600 dark:text-red-400',
      )}
    >
      <Icon className="size-3" />
      {pct > 0 ? '+' : ''}
      {pct}
      % vs usual
    </span>
  );
}

export function PulseTiles({ pulse }: { pulse: Pulse }) {
  // Below 1 the day is still running, so today is only part of a day and every
  // comparison on this panel is a partial one.
  const partial = pulse.elapsed_share < 0.999;
  const sharePct = Math.round(pulse.elapsed_share * 100);

  return (
    <div className="space-y-2">
      {!pulse.baseline_covered && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
          No baseline:
          {' '}
          {pulse.baseline_missing_days.length}
          {' of the last '}
          {pulse.baseline_weeks}
          {' '}
          {pulse.weekday}
          s were never computed, so there is nothing honest to compare today with.
          Run the reporting backfill to fill them.
        </p>
      )}
      {/* The basis, stated. The comparison used to weigh today-so-far against
          four COMPLETE weekdays, so every metric read as down all morning — and
          nothing on screen said what it was comparing, which is what let that
          survive. */}
      {partial && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {`Today so far, against the same ${sharePct}% of a typical day — `}
          {`by this point a typical ${pulse.weekday} has seen `}
          {`${sharePct}% of its play, so the comparison is like for like.`}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TILES.map(({ key, label, hint }) => {
          const metric = pulse.metrics[key];
          return (
            <Card key={key}>
              <CardContent className="space-y-1 p-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {metric.today.toLocaleString()}
                </p>
                <Delta metric={metric} />
                <p className="pt-1 text-xs text-gray-500 dark:text-gray-400">
                  {hint}
                  {' · '}
                  {metric.baseline_same_weekday === null
                    ? `no typical ${pulse.weekday} to compare with yet`
                    // "by now" only while the day is running. Once it is over
                    // the baseline IS the whole weekday, and saying "by now"
                    // would keep implying a partial comparison that has ended.
                    : `typical ${pulse.weekday}${partial ? ' by now' : ''}: ${metric.baseline_same_weekday.toLocaleString()}`}
                </p>
                {/* On a part-day, the whole-day figure answers a different
                    question — what today is heading for, not how it compares. */}
                {partial && metric.baseline_full_day !== null && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {`Full ${pulse.weekday}: ${metric.baseline_full_day.toLocaleString()}`}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
