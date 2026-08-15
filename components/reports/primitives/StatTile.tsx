import type { ReactNode } from 'react';
import { MetricInfo } from '@/components/reports/primitives/MetricInfo';
import { Card, CardContent } from '@/components/ui/card';

/**
 * One number with its name.
 *
 * Seven places had grown their own version of this — two called `Tile`, one
 * `Stat`, four inlined — and they had already diverged: the figure rendered at
 * `text-2xl` in three and `text-3xl` in four, so the same kind of number was a
 * different size depending on which report you opened. Only one accepted a
 * `metric`, so the glossary link appeared on some figures and not others for no
 * reason a reader could see.
 *
 * The figure is `font-semibold`, not `font-bold`: at this size bold is heavy
 * enough to pull the eye past the label that says what the number means, and
 * tightening the tracking recovers the density the weight was standing in for.
 */
export function StatFigure({ label, value, delta, hint, metric }: {
  /** ReactNode, because some labels carry an icon alongside the words. */
  label: ReactNode;
  /** Pre-formatted. A tile shows a figure; it does not decide how it reads. */
  value: ReactNode;
  /**
   * Change against a previous period, when there is one. Sits between figure and
   * hint because it qualifies the number, not the explanation underneath it.
   */
  delta?: ReactNode;
  hint?: ReactNode;
  /** Glossary key, when the label alone cannot say what is being counted. */
  metric?: string;
}) {
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
        {label}
        {metric && <MetricInfo metric={metric} />}
      </p>
      <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
      {delta}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/**
 * The same figure in its own card.
 *
 * Split from StatFigure because one caller renders several figures INSIDE a
 * single card (per-day retention on the game detail page), and wrapping each in
 * its own card there would nest a card in a card — a border and a shadow around
 * something that is already inside a border and a shadow.
 */
export function StatTile(props: Parameters<typeof StatFigure>[0]) {
  return (
    <Card>
      <CardContent className="p-4">
        <StatFigure {...props} />
      </CardContent>
    </Card>
  );
}
