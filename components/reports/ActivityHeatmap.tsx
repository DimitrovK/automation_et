'use client';

import type { HourWeekdayRow, PeakCell } from '@/types/reports';
import { useTheme } from 'next-themes';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/** Every third hour, so the axis stays readable on a phone. */
const HOUR_TICKS = [0, 3, 6, 9, 12, 15, 18, 21];

/**
 * Discrete buckets, not a continuous ramp.
 *
 * The first version scaled opacity continuously. Nobody can tell 60% opacity
 * from 70%, so on a week where most hours have some play the whole grid read as
 * one wash of green — the exact complaint. Four steps can be told apart, and a
 * legend can state what each one means.
 *
 * Both ramps validated against their own surface: single hue, monotone
 * lightness, adjacent steps at least 0.06 apart, lightest step clearing 2:1 so
 * it is distinguishable from an empty cell.
 */
const RAMP_LIGHT = ['#10b981', '#059669', '#047857', '#064e3b'];
const RAMP_DARK = ['#047857', '#059669', '#34d399', '#a7f3d0'];

/** Exported so the per-surface choice is testable rather than implicit. */
export function heatmapRamp(isDark: boolean): string[] {
  return isDark ? RAMP_DARK : RAMP_LIGHT;
}

/** Quartile-style thresholds as a share of the busiest cell. */
const BUCKET_EDGES = [0.25, 0.5, 0.75];

function bucketOf(value: number, busiest: number): number {
  if (value <= 0 || busiest <= 0) return -1;
  const share = value / busiest;
  for (let i = 0; i < BUCKET_EDGES.length; i++) {
    if (share <= BUCKET_EDGES[i]) return i;
  }
  return BUCKET_EDGES.length;
}

/**
 * Sessions by weekday × hour.
 *
 * The point of the grid over the two bar charts: a peak weekday and a peak hour
 * don't have to intersect at a busy cell. On real data they don't — so "when is
 * it busiest" is only answerable here.
 */
export function ActivityHeatmap({
  rows,
  peakCell,
  busiest,
  timezone,
}: {
  rows: HourWeekdayRow[];
  peakCell: PeakCell | null;
  busiest: number;
  timezone: string;
}) {
  const [hovered, setHovered] = useState<{ row: HourWeekdayRow; hour: number } | null>(null);
  const { resolvedTheme } = useTheme();
  const ramp = heatmapRamp(resolvedTheme === 'dark');

  const total = useMemo(
    () => rows.reduce((sum, row) => sum + row.hours.reduce((a, b) => a + b, 0), 0),
    [rows],
  );


  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>When people play</CardTitle>
          <CardDescription>No activity in this window.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>When people play</CardTitle>
        <CardDescription>
          Sessions started by weekday and hour, in
          {' '}
          {timezone}
          .
          {peakCell
            ? ` Busiest slot is ${peakCell.name} at ${String(peakCell.hour).padStart(2, '0')}:00 (${peakCell.games_started.toLocaleString()}).`
            : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[520px]">
            <div className="mb-1 flex pl-10">
              {Array.from({ length: 24 }, (_, hour) => (
                <div key={hour} className="flex-1 text-center text-[10px] text-gray-500 dark:text-gray-400">
                  {HOUR_TICKS.includes(hour) ? String(hour).padStart(2, '0') : ''}
                </div>
              ))}
            </div>

            {rows.map(row => (
              <div key={row.weekday} className="mb-0.5 flex items-center">
                <div className="w-10 shrink-0 pr-1 text-right text-[11px] text-gray-600 dark:text-gray-300">
                  {row.name.slice(0, 3)}
                </div>
                {row.hours.map((value, hour) => {
                  const isPeak = peakCell?.weekday === row.weekday && peakCell?.hour === hour;
                  return (
                    <button
                      type="button"
                      // eslint-disable-next-line react/no-array-index-key
                      key={hour}
                      onMouseEnter={() => setHovered({ row, hour })}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={() => setHovered({ row, hour })}
                      onBlur={() => setHovered(null)}
                      // Screen readers get the number outright; colour alone
                      // carries no information here.
                      aria-label={`${row.name} ${String(hour).padStart(2, '0')}:00 — ${value} sessions`}
                      className={cn(
                        'mx-px h-5 flex-1 rounded-[2px] transition-transform hover:scale-125',
                        isPeak && 'ring-1 ring-emerald-500 ring-offset-1 dark:ring-offset-slate-900',
                      )}
                      style={{
                        backgroundColor: bucketOf(value, busiest) >= 0
                          ? ramp[bucketOf(value, busiest)]
                          : undefined,
                      }}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600 dark:text-gray-300">
          <span className="min-h-4">
            {hovered
              ? `${hovered.row.name} ${String(hovered.hour).padStart(2, '0')}:00 — ${hovered.row.hours[hovered.hour].toLocaleString()} sessions`
              : 'Hover a cell for the exact count.'}
          </span>
          <span className="flex flex-wrap items-center gap-1">
            <span className="mr-1">Sessions</span>
            <span className="size-3 rounded-[2px] border border-gray-300 dark:border-slate-600" />
            <span className="mr-1">0</span>
            {ramp.map((colour, index) => {
              const low = index === 0 ? 1 : Math.round(BUCKET_EDGES[index - 1] * busiest) + 1;
              const high = index === ramp.length - 1 ? busiest : Math.round(BUCKET_EDGES[index] * busiest);
              return (
                <span key={colour} className="flex items-center gap-1">
                  <span className="size-3 rounded-[2px]" style={{ backgroundColor: colour }} />
                  {/* The counts are stated, so the colour never has to be
                      decoded by eye against a gradient. */}
                  <span>{low === high ? low : `${low}–${high}`}</span>
                </span>
              );
            })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
