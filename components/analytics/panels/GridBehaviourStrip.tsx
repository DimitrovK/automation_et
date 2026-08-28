'use client';

import type { SummaryResponse } from '@/types/reports';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { StatTile } from '@/components/reports/primitives/StatTile';

/**
 * The behaviour glance, folded into the content page.
 *
 * Four numbers from the reporting summary so a reader judging Grid's
 * content doesn't have to hold the player-behaviour picture in their head
 * from another tab. The full behavioural view (activity, retention,
 * durations, top players) stays in /reports/games/grid — this strip is
 * the summary of it, and links there.
 */
export function GridBehaviourStrip({ data }: { data: SummaryResponse }) {
  const row = data.by_game.find(entry => entry.game_type === 'grid');
  if (!row) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          label="Completion"
          metric="completion_pct"
          value={row.completion_pct === null ? '—' : `${row.completion_pct}%`}
          hint="Of games started"
        />
        <StatTile
          label="Repeat rate"
          metric="repeat_rate_pct"
          value={row.repeat_rate_pct === null ? '—' : `${row.repeat_rate_pct}%`}
          hint="Players who came back another day"
        />
        <StatTile
          label="Sessions per player"
          metric="sessions_per_player"
          value={row.sessions_per_player?.toString() ?? '—'}
        />
        <StatTile
          label="Share of platform"
          metric="share_pct"
          value={row.share_pct === null ? '—' : `${row.share_pct}%`}
          hint="Of all games played"
        />
      </div>
      <Link
        href="/reports/games/grid"
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        The full behaviour view — activity, retention, durations, top players
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
