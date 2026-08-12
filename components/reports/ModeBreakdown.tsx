'use client';

import type { GameMetaMap } from '@/hooks/use-game-meta';
import type { MultiplayerModeRow } from '@/types/reports';
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { GameBadge } from '@/components/reports/GameBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FALLBACK_COLOR } from '@/hooks/use-game-meta';

/** Quiz has no mode column, so its rooms arrive as null rather than being dropped. */
function modeLabel(mode: string | null): string {
  if (!mode) {
    return 'No mode';
  }
  return mode.split('_').map(part => part.charAt(0) + part.slice(1).toLowerCase()).join(' ');
}

/**
 * Modes are shared across games, so the totals answer "is Elimination working
 * anywhere" — a question the per-game funnel can't. The per-game split below it
 * then shows which games drive each mode.
 */
export function ModeBreakdown({ rows, meta, onSelectGame }: {
  rows: MultiplayerModeRow[];
  meta: GameMetaMap;
  onSelectGame?: (gameKey: string) => void;
}) {
  const byMode = new Map<string, { mode: string; rooms_created: number; rooms_started: number; games: MultiplayerModeRow[] }>();
  for (const row of rows) {
    const label = modeLabel(row.mode);
    const bucket = byMode.get(label) ?? { mode: label, rooms_created: 0, rooms_started: 0, games: [] };
    bucket.rooms_created += row.rooms_created;
    bucket.rooms_started += row.rooms_started;
    bucket.games.push(row);
    byMode.set(label, bucket);
  }
  const modes = [...byMode.values()].sort((a, b) => b.rooms_created - a.rooms_created);

  return (
    <Card>
      <CardHeader>
        <CardTitle>By mode</CardTitle>
        <CardDescription>
          Modes are shared across games, so this shows which formats people actually
          play — not just which games have multiplayer.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {modes.length === 0
          ? (
              <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                No multiplayer rooms in this window.
              </p>
            )
          : (
              <>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={modes} margin={{ top: 16, right: 8, bottom: 8, left: -12 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-slate-700" />
                      <XAxis dataKey="mode" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={44} />
                      <Tooltip contentStyle={{ fontSize: 12 }} cursor={{ fillOpacity: 0.1 }} />
                      <Bar dataKey="rooms_created" name="Rooms" radius={[4, 4, 0, 0]}>
                        <LabelList dataKey="rooms_created" position="top" style={{ fontSize: 11 }} />
                        {modes.map(mode => (
                          <Cell key={mode.mode} fill={meta[mode.games[0]?.game_type ?? '']?.color ?? FALLBACK_COLOR} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                  {modes.map(mode => (
                    <div key={mode.mode} className="space-y-2">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{mode.mode}</h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {mode.rooms_created.toLocaleString()}
                          {' rooms · '}
                          {mode.rooms_started.toLocaleString()}
                          {' started'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[...mode.games]
                          .sort((a, b) => b.rooms_created - a.rooms_created)
                          .map(game => (
                            <GameBadge
                              key={`${game.game_type}-${game.mode}`}
                              gameKey={game.game_type}
                              meta={meta}
                              count={game.rooms_created}
                              onClick={onSelectGame}
                            />
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
      </CardContent>
    </Card>
  );
}
