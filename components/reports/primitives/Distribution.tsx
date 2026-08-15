import { cn } from '@/lib/utils';

/**
 * A share across ordered bands, in one row.
 *
 * This shape keeps getting rebuilt: `DurationSpread` draws an interquartile bar,
 * `DurationHistogram` draws bands, `UnfinishedTable` prints "1h–1d: 30 (12%)" as
 * text — three answers to "where does this sit across a range". R3 (where inside
 * a session people quit) and R5 (win rate by difficulty) both need it again,
 * which is what makes it worth having once.
 *
 * Deliberately NOT a chart. It has to work as a table cell beside ten others, at
 * a glance, without a legend — the moment it needs axes it belongs in `charts/`.
 */
export type Band = {
  label: string;
  count: number;
  /** Share of the row's total, already rounded. */
  pct: number;
};

export function Distribution({ bands, colour, className }: {
  bands: Band[];
  /**
   * Fill for the bars. One colour, varied by opacity across bands — a
   * categorical palette here would say the bands are different KINDS of thing,
   * when they are the same thing at different points on a scale.
   */
  colour?: string;
  className?: string;
}) {
  const total = bands.reduce((sum, band) => sum + band.count, 0);
  if (total === 0) {
    // Not a row of zero-width bars: an empty distribution has no shape, and
    // drawing one implies a measurement that was never taken.
    return <span className="text-xs text-muted-foreground/70">—</span>;
  }

  return (
    <span className={cn('flex flex-col gap-1', className)}>
      <span className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
        {bands.map((band, index) => (
          <span
            key={band.label}
            // Width from the raw count, not the rounded percentage: rounding each
            // band on its own is right for the LABEL and wrong for the geometry,
            // where the remainders have to add up or the bar has a gap in it.
            style={{
              width: `${(band.count / total) * 100}%`,
              backgroundColor: colour,
              // Later bands sit further along the scale, so they read heavier.
              opacity: colour ? 0.35 + (0.65 * (index + 1)) / bands.length : undefined,
            }}
            className={cn('h-full', !colour && 'bg-muted-foreground/40')}
            title={`${band.label}: ${band.count.toLocaleString()} (${band.pct}%)`}
          />
        ))}
      </span>
      <span className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
        {bands.map(band => (
          <span key={band.label} className="whitespace-nowrap">
            {band.label}
            {': '}
            <span className="text-foreground">{band.count.toLocaleString()}</span>
            {` (${band.pct}%)`}
          </span>
        ))}
      </span>
    </span>
  );
}
