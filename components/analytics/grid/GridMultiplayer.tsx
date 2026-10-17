'use client';

import type { GridMultiplayer as GridMultiplayerData } from '@/types/reports';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { PanelCard } from '@/components/reports/primitives/PanelCard';
import { StatFigure } from '@/components/reports/primitives/StatTile';

const pct = (part: number, whole: number) => (whole ? `${Math.round((part / whole) * 100)}%` : '—');

const REASON_LABELS: Record<string, string> = {
  all_players_finished: 'Everyone finished',
  timeout: 'Timed out (results forced)',
  manual: 'Finished by staff',
  ended_by_game: 'Ended by the game',
};

/** The headline while folded: how many rooms got going, and who left early. */
function roomsSummary(data: GridMultiplayerData): string | undefined {
  const created = data.funnel?.rooms_created ?? 0;
  if (!created && !data.room_games) {
    return undefined;
  }
  return `${data.room_games.toLocaleString()} room games from ${created.toLocaleString()} lobbies · ${data.forfeit_pct}% of players forfeited`;
}

/**
 * Grid rooms: whether lobbies turn into games, whether players stay to the
 * whistle, and what the room helpers (VAR, Peek) are actually spent on.
 *
 * About rooms, so the page's play-type / board filters don't narrow it; the
 * sessions chart and the modes table do cover room games when you pick
 * Multiplayer there.
 */
export function GridMultiplayer({ data }: { data: GridMultiplayerData }) {
  const funnel = data.funnel;
  const waiting = data.room_games - data.released;
  const reasons = Object.entries(data.finish_reasons).sort((a, b) => b[1] - a[1]);

  return (
    <PanelCard
      id="grid-multiplayer"
      defaultOpen
      title="Grid rooms"
      summary={roomsSummary(data)}
      description="Rooms in the date range: lobbies to finished games, who stays, and how VAR and Peek are used. Not narrowed by the filters above."
    >
      {!funnel && data.room_games === 0
        ? <EmptyState hint="Rooms are rolled out by audience in Grid settings.">No Grid room in this window.</EmptyState>
        : (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatFigure label="Lobbies opened" value={(funnel?.rooms_created ?? 0).toLocaleString()} hint={funnel ? `${funnel.never_started_pct}% never started` : undefined} />
                <StatFigure label="Games played" value={data.room_games.toLocaleString()} hint={waiting > 0 ? `${waiting.toLocaleString()} still waiting for results` : 'All results released'} />
                <StatFigure label="Players per room" value={data.avg_players?.toString() ?? '—'} hint={`${data.player_sessions.toLocaleString()} player games`} />
                <StatFigure label="Forfeited" value={`${data.forfeit_pct}%`} hint={`${data.forfeited.toLocaleString()} left or went idle`} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1 text-sm">
                  <p className="font-medium">How rooms ended</p>
                  {reasons.length === 0
                    ? <p className="text-muted-foreground">No room has released its results yet.</p>
                    : reasons.map(([reason, count]) => (
                        <p key={reason} className="flex justify-between gap-2">
                          <span className="text-muted-foreground">{REASON_LABELS[reason] ?? reason}</span>
                          <span className="tabular-nums">{count.toLocaleString()}</span>
                        </p>
                      ))}
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">VAR</p>
                  <p className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Rooms with VAR on</span>
                    <span className="tabular-nums">{pct(data.var_enabled_rooms, data.room_games)}</span>
                  </p>
                  <p className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Checks used</span>
                    <span className="tabular-nums">{data.var_checks.toLocaleString()}</span>
                  </p>
                  <p className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Found a wrong card</span>
                    <span className="tabular-nums">{pct(data.var_found_wrong, data.var_checks)}</span>
                  </p>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">Peek</p>
                  <p className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Rooms with Peek on</span>
                    <span className="tabular-nums">{pct(data.peek_enabled_rooms, data.room_games)}</span>
                  </p>
                  <p className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Peeks spent</span>
                    <span className="tabular-nums">{data.peeks.toLocaleString()}</span>
                  </p>
                  <p className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Showed a card</span>
                    <span className="tabular-nums">{pct(data.peeks_shown, data.peeks)}</span>
                  </p>
                  <p className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Players who peeked</span>
                    <span className="tabular-nums">{pct(data.sessions_peeking, data.player_sessions)}</span>
                  </p>
                </div>
              </div>
            </div>
          )}
    </PanelCard>
  );
}
