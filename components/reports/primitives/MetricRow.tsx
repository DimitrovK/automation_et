import type { ReactNode } from 'react';
import { MetricInfo } from '@/components/reports/primitives/MetricInfo';
import { cn } from '@/lib/utils';

/**
 * Several figures read across, inside a panel that already has a card.
 *
 * `StatTile` is the carded version and is right at the top of a page. Inside a
 * card it nests a card in a card, so panels lay figures out by hand instead —
 * `GameLeaderboard` builds a `<dl>` grid, the per-game page builds a `<div>`
 * grid, and each picked its own label size and column count.
 *
 * A `<dl>` because that is what this is: terms and their values. The hand-rolled
 * versions were split between `<dl>` and `<div>`, and the `<div>` ones gave a
 * screen reader a wall of unassociated text.
 */
export type Metric = {
  label: string;
  value: ReactNode;
  /** Glossary key, when the label cannot say what is counted. */
  metric?: string;
};

export function MetricRow({ metrics, columns = 6, className }: {
  metrics: Metric[];
  /** Columns at the widest breakpoint; it steps down on smaller screens. */
  columns?: 3 | 4 | 6;
  className?: string;
}) {
  const widest = { 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 6: 'lg:grid-cols-6' }[columns];

  return (
    <dl className={cn('grid grid-cols-2 gap-3 text-sm sm:grid-cols-3', widest, className)}>
      {metrics.map(({ label, value, metric }) => (
        <div key={label}>
          <dt className="flex items-center gap-1 text-xs text-muted-foreground">
            {label}
            {metric && <MetricInfo metric={metric} />}
          </dt>
          {/* Tabular figures so a column of numbers lines up on the decimal —
              these are read down as much as across. */}
          <dd className="font-medium text-foreground tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
