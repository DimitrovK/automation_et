import type { SparklinePoint } from '@/lib/sparkline';
import { HEIGHT, toPath, VIEWBOX, WIDTH } from '@/lib/sparkline';
import { cn } from '@/lib/utils';

/**
 * Direction for one row of a ranked table, in the width of a cell.
 *
 * The last of R9's shared pieces, and the one that had to wait: it needs a
 * per-row series, and until `per_game_series` shipped no endpoint returned one.
 * Building it earlier would have meant building it against imagined data.
 *
 * Deliberately not a chart library. Recharts needs a measured container and
 * renders nothing at this size in a table cell; this is one `<path>` and no
 * axes, because a sparkline that needs a legend is a chart in the wrong place.
 * The trend column beside it carries the precise figure — this only has to show
 * the shape.
 */
export function Sparkline({ points, label, className }: {
  points: SparklinePoint[];
  /** What the line is of, for anyone not reading it visually. */
  label: string;
  className?: string;
}) {
  const path = toPath(points);
  if (!path) {
    // Two points is the minimum that has a direction. One is a dot pretending
    // to be a trend.
    return <span className={cn('text-xs text-muted-foreground/70', className)}>—</span>;
  }

  const known = points.filter((point): point is number => point !== null);
  const rising = known[known.length - 1] >= known[0];

  return (
    <svg
      viewBox={VIEWBOX}
      width={WIDTH}
      height={HEIGHT}
      className={cn('overflow-visible', className)}
      role="img"
      aria-label={label}
      preserveAspectRatio="none"
    >
      <path
        d={path}
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={rising
          ? 'stroke-emerald-500 dark:stroke-emerald-400'
          : 'stroke-red-500 dark:stroke-red-400'}
      />
    </svg>
  );
}
