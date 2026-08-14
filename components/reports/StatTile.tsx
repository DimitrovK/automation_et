import type { ReactNode } from 'react';
import { MetricInfo } from '@/components/reports/MetricInfo';
import { Card, CardContent } from '@/components/ui/card';

/**
 * One number with its name, in a card.
 *
 * Four pages had grown their own copy of this — two called it `Tile`, one
 * called it `Stat`, one inlined it — and they had already diverged: three
 * rendered the value at `text-2xl`, the fourth at `text-3xl`, so the same kind
 * of figure was a different size depending on which page you were reading. Only
 * one of the four accepted a `metric`, so the glossary link was available on
 * some numbers and not others for no reason a reader could see.
 *
 * The value is `font-semibold`, not `font-bold`: at this size bold is heavy
 * enough to pull the eye past the label that says what the number means, and
 * tightening the tracking recovers the density that weight was standing in for.
 */
export function StatTile({ label, value, hint, metric }: {
  label: string;
  /** Pre-formatted. Tiles show a figure, they do not decide how it reads. */
  value: ReactNode;
  hint?: string;
  /** Glossary key, when the label alone cannot say what is being counted. */
  metric?: string;
}) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
          {label}
          {metric && <MetricInfo metric={metric} />}
        </p>
        <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}
