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
    return (
      <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
        <Minus className="size-3" />
        no baseline yet
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
  return (
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
                typical
                {' '}
                {pulse.weekday}
                {': '}
                {metric.baseline_same_weekday.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
