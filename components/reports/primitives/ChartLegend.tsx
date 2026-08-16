import { MetricInfo } from '@/components/reports/primitives/MetricInfo';
import { cn } from '@/lib/utils';

/**
 * The key to a chart with more than one series.
 *
 * Every stacked chart on this surface identified its bands through the hover
 * tooltip alone. That works for exactly one reader: someone with a mouse,
 * looking at the screen, who thinks to hover. It is unreachable by keyboard,
 * absent on touch, and gone the moment the chart is screenshotted into a
 * message — which is how these charts actually travel.
 *
 * Deliberately not recharts' `<Legend />`: that one reserves layout inside the
 * plot area and re-flows the chart, and it cannot carry the glossary link. The
 * bands here are `retained`/`resurrected`/`new`/`churned` — four words that each
 * mean something specific and none of which explain themselves.
 *
 * A single series gets no legend. The card title already names it, and a
 * one-row key beside one colour is furniture.
 */
export type LegendSeries = {
  /** The name of the series, as it reads in the tooltip. */
  label: string;
  /** The colour of the mark, from the chart theme — never a literal. */
  colour: string;
  /** Glossary key, when the label cannot say what is counted. */
  metric?: string;
};

export function ChartLegend({ series, className }: {
  series: LegendSeries[];
  className?: string;
}) {
  // One series is named by the title above it. Rendering the key anyway would
  // add a row that carries no information the reader does not already have.
  if (series.length < 2) {
    return null;
  }

  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs', className)}>
      {series.map(({ label, colour, metric }) => (
        <li key={label} className="flex items-center gap-1.5">
          {/* The swatch carries the colour; the label carries the identity. A
              reader who cannot separate two of these hues still has the word. */}
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-[3px]"
            style={{ backgroundColor: colour }}
          />
          <span className="text-muted-foreground">{label}</span>
          {metric && <MetricInfo metric={metric} />}
        </li>
      ))}
    </ul>
  );
}
