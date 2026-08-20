import { DataBar } from '@/components/reports/primitives/DataBar';
import { cn } from '@/lib/utils';

/**
 * A ranked list where each row carries its own bar.
 *
 * The form a plotting library is wrong for. Seven career-path modes run 7,854
 * against 29 — a 271x spread — so a bar chart draws one full bar and six
 * slivers, and at half a card's width the axis labels wrap before the bars say
 * anything. A list reads the same at any width, needs no axis, and puts the
 * figure where it is read rather than behind a hover.
 *
 * That last part is the point. The chart this replaces tried to print its
 * values with a recharts `LabelList` whose `content` returned a string rather
 * than an element, so it rendered NOTHING and shipped seven unlabelled bars.
 * There is no label to fail to render when the number is just text in a row.
 *
 * The label sits above the bar rather than beside it: a fixed label column
 * either truncates the long names or starves the bar, and both get worse as the
 * card narrows.
 */
export type BarRow = {
  /** The visible name, and the row's key. Unique within a list. */
  label: string;
  /** What the bar's LENGTH encodes. */
  value: number;
  /** The figure as it should read. Rows print this, never `value` raw. */
  display: string;
  /** A second, quieter figure — a share, or the count behind a rate. */
  hint?: string;
};

export function BarRows({ rows, max, colour, track, minPct = 1, emptyLabel, className }: {
  rows: BarRow[];
  /**
   * What a full bar means. A fixed 100 for rates, the top row for volumes —
   * scaling a RATE to the biggest row turns a 12-point spread into a full track
   * and overstates it.
   */
  max: number;
  /** Tailwind background class from `lib/data-colours`, never an ad-hoc hue. */
  colour: string;
  track?: string;
  /** See `DataBar`. One percent keeps the smallest non-zero row visible. */
  minPct?: number;
  emptyLabel: string;
  className?: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    // A description list, because that is what it is: names and their figures.
    // A stack of divs hands a screen reader the labels and the numbers as one
    // undifferentiated run of text.
    <dl className={cn('space-y-2.5', className)}>
      {rows.map(row => (
        <div key={row.label} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="min-w-0 truncate text-sm text-foreground">{row.label}</dt>
            <dd className="shrink-0 text-sm tabular-nums">
              <span className="font-semibold text-foreground">{row.display}</span>
              {row.hint && <span className="ml-1.5 text-xs text-muted-foreground">{row.hint}</span>}
            </dd>
          </div>
          <DataBar
            value={row.value}
            max={max}
            colour={colour}
            track={track}
            minPct={minPct}
            // Repeats what the row already says in text, because the bar is a
            // separate `role="img"` node and reaches a screen reader on its own.
            label={`${row.label}: ${row.display}${row.hint ? ` ${row.hint}` : ''}`}
            className="h-2"
          />
        </div>
      ))}
    </dl>
  );
}
