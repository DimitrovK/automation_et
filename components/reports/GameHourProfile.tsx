'use client';

import type { PatternsResponse } from '@/types/reports';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * When this game is played, across the day.
 *
 * Shown as each hour's share of the game's own play, not as raw counts: a
 * popular game and a quiet one have the same shape question, and counts would
 * make every small game look flat. The point is the skew — a lunchtime game and
 * an evening game want different things from a release schedule.
 */
export function GameHourProfile({ data, gameLabel }: { data: PatternsResponse; gameLabel: string }) {
  const hours = data.by_hour ?? [];
  const total = hours.reduce((sum, hour) => sum + hour.games_started, 0);
  if (total === 0) {
    return null;
  }

  const max = Math.max(...hours.map(hour => hour.games_started), 1);
  const peak = hours.reduce((best, hour) => (hour.games_started > best.games_started ? hour : best), hours[0]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">When it's played</CardTitle>
        <CardDescription>
          {`${gameLabel}'s own play across the day, in ${data.timezone}. Busiest hour: `}
          <strong>
            {`${String(peak.hour).padStart(2, '0')}:00`}
          </strong>
          {`, ${Math.round((peak.games_started / total) * 100)}% of its sessions start in that hour.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Labelled per bar, the way the heatmap and the multiplayer funnel
            already are. `title` is a hover affordance: unreliable for screen
            readers and absent on touch, so the numbers behind each bar have to
            be in the accessibility tree rather than only under a mouse. */}
        <ul
          className="flex h-24 items-end gap-0.5"
          aria-label={`${gameLabel} sessions by hour, ${data.timezone}`}
        >
          {hours.map((hour) => {
            const label = `${String(hour.hour).padStart(2, '0')}:00 — ${hour.games_started.toLocaleString()} sessions (${Math.round((hour.games_started / total) * 100)}%)`;
            return (
              <li key={hour.hour} className="flex-1" title={label} aria-label={label}>
                <div
                  className="w-full rounded-sm bg-emerald-500/80 dark:bg-emerald-500/70"
                  style={{ height: `${Math.max(2, (hour.games_started / max) * 96)}px` }}
                  aria-hidden
                />
              </li>
            );
          })}
        </ul>
        <div className="mt-1 flex justify-between text-[10px] text-gray-400 dark:text-gray-500">
          <span>00:00</span>
          <span>06:00</span>
          <span>12:00</span>
          <span>18:00</span>
          <span>23:00</span>
        </div>
      </CardContent>
    </Card>
  );
}
