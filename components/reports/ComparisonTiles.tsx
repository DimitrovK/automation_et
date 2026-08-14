'use client';

import type { ActivityMetrics, PeriodComparison } from '@/types/reports';
import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { StatTile } from '@/components/reports/StatTile';
import { cn } from '@/lib/utils';

const TILES: { key: keyof ActivityMetrics; label: string }[] = [
  { key: 'games_started', label: 'Games played' },
  { key: 'games_finished', label: 'Games finished' },
  { key: 'distinct_players', label: 'Players' },
  { key: 'mp_player_sessions', label: 'Multiplayer' },
];

/**
 * The selected period against an earlier one.
 *
 * Replaces the daily pulse whenever the range doesn't end today: "how is today
 * going" is not an answer to "how did 1–15 June do", and showing it anyway made
 * the date picker look broken.
 *
 * The footer states which period was compared, always. The comparison used to
 * be fixed at "the days immediately before" and said so in fixed text; now that
 * it can reach further back or name a period outright, text that didn't move
 * with it would be a caption describing a different chart.
 */
export function ComparisonTiles({ comparison }: { comparison: PeriodComparison }) {
  // null and undefined mean different things here. `null` is a period the
  // reader named, which no offset describes. `undefined` is a backend that
  // predates the field — and that backend always compared with the period
  // immediately before, so it reads as offset 1 rather than as something
  // unknown. Conflating them would caption a legacy response "a period you
  // named", which nobody did.
  const offset = comparison.compare_offset === undefined ? 1 : comparison.compare_offset;
  const named = offset === null;
  // "vs previous" was accurate while the comparison was always the preceding
  // period. Now it isn't, and a tile reading "-50% vs previous" against a
  // period three back is the kind of wrong that looks right.
  const offsetLabel = named
    ? 'the period shown'
    : offset === 1 ? 'previous' : `${offset} periods back`;

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
            <StatTile
              key={key}
              label={label}
              value={metric.current.toLocaleString()}
              delta={(
                <span
                  className={cn(
                    'flex items-center gap-1 text-xs font-medium',
                    pct === null || flat
                      ? 'text-muted-foreground'
                      : up
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400',
                  )}
                >
                  <Icon className="size-3" />
                  {pct === null
                    ? (comparison.same_length === false
                        ? 'periods differ in length'
                        : metric.previous === 0 ? 'no earlier activity' : 'incomplete data')
                    : `${pct > 0 ? '+' : ''}${pct}% vs ${offsetLabel}`}
                </span>
              )}
              hint={(
                <>
                  {metric.previous.toLocaleString()}
                  {' previously · '}
                  {metric.change > 0 ? '+' : ''}
                  {metric.change.toLocaleString()}
                </>
              )}
            />
          );
        })}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {comparison.current.start}
        {' → '}
        {comparison.current.end}
        {' compared with '}
        {comparison.previous.start}
        {' → '}
        {comparison.previous.end}
        {' ('}
        {comparison.previous.days}
        {comparison.previous.days === 1 ? ' day' : ' days'}
        {named
          ? ', a period you named'
          : offset === 1 ? ', immediately before' : `, ${offset} periods back`}
        ).
        {comparison.same_length === false
          && ' The periods differ in length, so totals are shown without percentages — a rate across unequal spans describes the calendar, not the platform.'}
        {!comparison.coverage.complete
          && ' Percentages are hidden because some days in these periods were never computed — run the reporting backfill to fill them.'}
      </p>
    </div>
  );
}
