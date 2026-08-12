'use client';

import type { HourWeekdayRow, PeakCell } from '@/types/reports';
import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/** Every third hour, so the axis stays readable on a phone. */
const HOUR_TICKS = [0, 3, 6, 9, 12, 15, 18, 21];

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

  const total = useMemo(
    () => rows.reduce((sum, row) => sum + row.hours.reduce((a, b) => a + b, 0), 0),
    [rows],
  );

  /**
   * Square-root scale, not linear. Play is heavily peaked, so a linear ramp
   * renders everything except the top few cells as near-empty and hides the
   * shape of an ordinary week — which is the thing you're looking at.
   */
  function intensity(value: number) {
    if (value <= 0 || busiest <= 0) {
      return 0;
    }
    return Math.sqrt(value / busiest);
  }

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
                        backgroundColor: value > 0
                          ? `rgba(16, 185, 129, ${0.12 + intensity(value) * 0.88})`
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
          <span className="flex items-center gap-1">
            0
            {[0.15, 0.4, 0.65, 1].map(step => (
              <span
                key={step}
                className="size-3 rounded-[2px]"
                style={{ backgroundColor: `rgba(16, 185, 129, ${0.12 + step * 0.88})` }}
              />
            ))}
            {busiest.toLocaleString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
