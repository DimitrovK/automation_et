'use client';

import type { ReactNode } from 'react';

type Entry = {
  name?: string;
  value?: number | string | null;
  color?: string;
  dataKey?: string | number;
  /** The whole row behind this point — what a footer or a per-datum colour reads. */
  payload?: Record<string, unknown>;
};

/**
 * A bar coloured per-`<Cell>` reports no series colour: recharts fills the
 * entry's `color` from the `<Bar>`'s own `fill`, which such a chart doesn't
 * set. The row carries it instead, so the dot falls back to that rather than
 * rendering as an invisible gap where the identity mark should be.
 */
function markColor(entry: Entry): string | undefined {
  const fill = entry.payload?.fill;
  return entry.color ?? (typeof fill === 'string' ? fill : undefined);
}

/**
 * The tooltip every report chart uses.
 *
 * Recharts' default lists series names as plain text, so hovering gave
 * "28 Jul · Finished 20123 · Multi 0 · Played 235 · Players 19" with nothing
 * tying each name back to the line it came from — the legend coloured them, the
 * tooltip didn't, and the reader had to match them by memory.
 *
 * Each row now carries a dot in its series colour. The text stays in text
 * tokens rather than taking the series colour: a coloured mark beside a label
 * carries identity without costing legibility, which coloured text on a small
 * tooltip does.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  labelFormatter,
  valueFormatter,
  footer,
}: {
  active?: boolean;
  payload?: Entry[];
  label?: string | number;
  labelFormatter?: (label: string | number) => ReactNode;
  valueFormatter?: (value: number | string, entry: Entry) => ReactNode;
  /**
   * A derived line below the series — a rate or a share the rows imply but
   * don't list. Given the first row, since every series shares one datum.
   * Return a falsy value when the datum can't support it: an empty rule with
   * nothing under it reads as a rendering fault, and "undefined%" reads as a
   * number.
   */
  footer?: (row: Record<string, unknown>) => ReactNode;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const row = payload[0]?.payload;
  const footerText = footer && row ? footer(row) : null;
  // A scatter has no meaningful shared label — its identity is the point, not
  // an x-value — so a formatter may return nothing. Rendering the heading
  // anyway leaves an empty line with its own margin above the series. Checked
  // against '' rather than falsiness: hour 0 is a real label.
  const labelText = label === undefined ? undefined : labelFormatter ? labelFormatter(label) : label;
  const hasLabel = labelText !== undefined && labelText !== null && labelText !== '';

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      {hasLabel && (
        <p className="mb-1 font-medium text-popover-foreground">
          {labelText}
        </p>
      )}
      {payload.map((entry, index) => (
        <p
          // Series can share a name across a stacked chart, so the key includes
          // the dataKey rather than trusting the label to be unique. The index
          // is the tiebreaker of last resort, not the key itself: this list is
          // one tooltip's rows, rebuilt from scratch on every hover, so there
          // is no reordering for a positional key to corrupt.
          // eslint-disable-next-line react/no-array-index-key
          key={`${entry.dataKey ?? entry.name ?? 'series'}-${index}`}
          className="flex items-center gap-1.5 text-muted-foreground"
        >
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: markColor(entry) }}
            aria-hidden
          />
          {entry.name}
          <span className="ml-auto pl-3 font-medium text-popover-foreground tabular-nums">
            {entry.value === null || entry.value === undefined
              ? '—'
              : valueFormatter
                ? valueFormatter(entry.value, entry)
                : typeof entry.value === 'number'
                  ? entry.value.toLocaleString()
                  : entry.value}
          </span>
        </p>
      ))}
      {footerText && (
        <p className="mt-1 border-t pt-1 text-xs text-muted-foreground">
          {footerText}
        </p>
      )}
    </div>
  );
}
