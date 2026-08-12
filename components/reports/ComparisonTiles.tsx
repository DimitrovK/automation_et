'use client';

import type { ActivityMetrics, PeriodComparison } from '@/types/reports';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const TILES: { key: keyof ActivityMetrics; label: string }[] = [
  { key: 'games_started', label: 'Games played' },
  { key: 'games_finished', label: 'Games finished' },
  { key: 'distinct_players', label: 'Players' },
  { key: 'mp_player_sessions', label: 'Multiplayer' },
];

/**
 * The selected period against the one before it.
 *
 * Replaces the daily pulse whenever the range doesn't end today: "how is today
 * going" is not an answer to "how did 1–15 June do", and showing it anyway made
 * the date picker look broken.
 */
export function ComparisonTiles({ comparison }: { comparison: PeriodComparison }) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {TILES.map(({ key, label }) => {
          const metric = comparison.metrics[key];
          const pct = metric.change_pct;
          const flat = pct !== null && Math.abs(pct) < 5;
          const up = (pct ?? metric.change) > 0;
          const Icon = pct === null ? Minus : flat ? Minus : up ? TrendingUp : TrendingDown;

          return (
            <Card key={key}>
              <CardContent className="space-y-1 p-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{label}</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {metric.current.toLocaleString()}
                </p>
                <span
                  className={cn(
                    'flex items-center gap-1 text-xs font-medium',
                    pct === null || flat
                      ? 'text-gray-500 dark:text-gray-400'
                      : up
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400',
                  )}
                >
                  <Icon className="size-3" />
                  {pct === null
                    ? (metric.previous === 0 ? 'no earlier activity' : 'incomplete data')
                    : `${pct > 0 ? '+' : ''}${pct}% vs previous`}
                </span>
                <p className="pt-1 text-xs text-gray-500 dark:text-gray-400">
                  {metric.previous.toLocaleString()}
                  {' previously · '}
                  {metric.change > 0 ? '+' : ''}
                  {metric.change.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-xs text-gray-500 dark:text-gray-400">
        {comparison.current.start}
        {' → '}
        {comparison.current.end}
        {' compared with '}
        {comparison.previous.start}
        {' → '}
        {comparison.previous.end}
        {' (the '}
        {comparison.previous.days}
        {' days immediately before).'}
        {!comparison.coverage.complete
          && ' Percentages are hidden because some days in these periods were never computed — run the reporting backfill to fill them.'}
      </p>
    </div>
  );
}
