'use client';

import type { ReactNode } from 'react';

type Entry = { name?: string; value?: number | string | null; color?: string; dataKey?: string | number };

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
}: {
  active?: boolean;
  payload?: Entry[];
  label?: string | number;
  labelFormatter?: (label: string | number) => ReactNode;
  valueFormatter?: (value: number | string, entry: Entry) => ReactNode;
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
            style={{ backgroundColor: entry.color }}
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
    </div>
  );
}
