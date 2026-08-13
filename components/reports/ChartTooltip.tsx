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
   */
  footer?: (row: Record<string, unknown>) => ReactNode;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-sm shadow-md">
      {label !== undefined && (
        <p className="mb-1 font-medium text-popover-foreground">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      {payload.map((entry, index) => (
        <p
          // Series can share a name across a stacked chart, so the key includes
          // the dataKey rather than trusting the label to be unique.
          key={`${entry.dataKey ?? entry.name ?? 'series'}-${index}`}
          className="flex items-center gap-1.5 text-muted-foreground"
        >
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: markColor(entry) }}
            aria-hidden
          />
          {entry.name}
          <span className="ml-auto pl-3 font-medium tabular-nums text-popover-foreground">
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
      {footer && payload[0]?.payload && (
        <p className="mt-1 border-t pt-1 text-xs text-muted-foreground">
          {footer(payload[0].payload)}
        </p>
      )}
    </div>
  );
}
