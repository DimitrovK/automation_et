'use client';

import type { GameMetaMap } from '@/hooks/use-game-meta';
import type { GameTotals, MetricKey } from '@/types/reports';
import { ChevronDown, ChevronRight, Minus, TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { GameBadge } from '@/components/reports/GameBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGameColor } from '@/hooks/use-game-meta';
import { cn } from '@/lib/utils';

/** '—' rather than 0 for a null rate: no data is not the same as zero. */
function rate(value: number | null, suffix = '%'): string {
  return value === null ? '—' : `${value}${suffix}`;
}

function Trend({ pct }: { pct: number | null }) {
  if (pct === null) {
    return <span className="text-muted-foreground/70">—</span>;
  }
  const flat = Math.abs(pct) < 5;
  const Icon = flat ? Minus : pct > 0 ? TrendingUp : TrendingDown;
  return (
    <span className={cn(
      'inline-flex items-center justify-end gap-1 tabular-nums',
      flat ? 'text-muted-foreground' : pct > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
    )}
    >
      <Icon className="size-3" />
      {pct > 0 ? '+' : ''}
      {pct}
      %
    </span>
  );
}

/** Proportional bar so the biggest game is obvious without reading numbers. */
function VolumeBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

/**
 * Games ranked by volume, with the rates that say whether that volume is
 * healthy. Volume alone tells you which game is biggest, not which is best — a
 * game with huge starts and 30% completion is a very different story from a
 * smaller one people finish and return to.
 *
 * Rows expand for the detail that would otherwise make the table unreadable on
 * a phone.
 */
export function GameLeaderboard({ rows, meta, metric, selected, onSelect }: {
  rows: GameTotals[];
  meta: GameMetaMap;
  metric: MetricKey;
  selected: string | null;
  onSelect: (gameKey: string | null) => void;
}) {
  const resolveColor = useGameColor();
  const [expanded, setExpanded] = useState<string | null>(null);
  const active = rows.filter(row => row.games_started > 0);
  const max = Math.max(...active.map(row => row[metric]), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Games</CardTitle>
        <CardDescription>
          Ranked by volume. Click a game to filter everything on this page to it, or a
          row to expand. Completion is how many started games get finished; repeat is
          how many of its players came back on another day.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* Header row — hidden on small screens, where the expanded panel carries it. */}
        <div className="hidden items-center gap-3 border-b px-2 pb-2 text-xs font-medium text-muted-foreground md:flex">
          <span className="w-6" />
          <span className="flex-1">Game</span>
          <span className="w-20 text-right">Played</span>
          <span className="w-24 text-right">Completion</span>
          <span className="w-20 text-right">Repeat</span>
          <span className="w-24 text-right">Trend</span>
        </div>

        {active.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No games played in this window.
          </p>
        )}

        {active.map((row) => {
          const color = resolveColor(meta, row.game_type);
          const isOpen = expanded === row.game_type;
          const isSelected = selected === row.game_type;

          return (
            <div
              key={row.game_type}
              className={cn(
                'rounded-md border transition-colors',
                isSelected
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10'
                  : 'border-transparent hover:bg-muted/50',
              )}
            >
              <div className="flex flex-wrap items-center gap-3 p-2 md:flex-nowrap">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-label={isOpen ? 'Collapse details' : 'Expand details'}
                  onClick={() => setExpanded(isOpen ? null : row.game_type)}
                  className="text-muted-foreground/70 hover:text-foreground/80"
                >
                  {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </button>

                <div className="flex min-w-40 flex-1 flex-col gap-1">
                  <GameBadge
                    gameKey={row.game_type}
                    meta={meta}
                    active={isSelected}
                    onClick={key => onSelect(isSelected ? null : key)}
                  />
                  <VolumeBar value={row[metric]} max={max} color={color} />
                </div>

                <span className="w-20 text-right text-sm font-medium tabular-nums text-foreground">
                  {row[metric].toLocaleString()}
                </span>
                <span className="w-24 text-right text-sm tabular-nums">{rate(row.completion_pct)}</span>
                <span className="w-20 text-right text-sm tabular-nums">{rate(row.repeat_rate_pct)}</span>
                <span className="w-24 text-right text-sm">
                  <Trend pct={row.trend_pct} />
                </span>
              </div>

              {isOpen && (
                <dl className="grid grid-cols-2 gap-3 border-t px-4 py-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
                  {[
                    ['Started', row.games_started.toLocaleString()],
                    ['Finished', row.games_finished.toLocaleString()],
                    ['Players', row.distinct_players.toLocaleString()],
                    ['Sessions / player', row.sessions_per_player ?? '—'],
                    ['Multiplayer', row.mp_player_sessions.toLocaleString()],
                    ['Solo', (row.games_started - row.mp_player_sessions).toLocaleString()],
                    ['Repeat players', row.repeat_players.toLocaleString()],
                    ['Share of platform', rate(row.share_pct)],
                    ['Previous window', row.previous_games_started.toLocaleString()],
                  ].map(([label, value]) => (
                    <div key={label as string}>
                      <dt className="text-xs text-muted-foreground">{label}</dt>
                      <dd className="font-medium tabular-nums text-foreground">{value}</dd>
                    </div>
                  ))}
                  <div className="col-span-2 sm:col-span-3 lg:col-span-6">
                    <Link
                      href={`/reports/games/${row.game_type}`}
                      className="text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                      Open full report for this game →
                    </Link>
                  </div>
                </dl>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
