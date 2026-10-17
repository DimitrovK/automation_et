'use client';

import type { TopPlayersResponse } from '@/types/reports';
import Link from 'next/link';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { PanelCard } from '@/components/reports/primitives/PanelCard';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/primitives/ReportTable';

/**
 * The busiest players of one game, with how much of their play was in rooms.
 * One card for Grid and every game page, so the two never drift.
 */
export function TopPlayersCard({ id, data, description }: {
  id: string;
  data: TopPlayersResponse;
  description: string;
}) {
  const leader = data.players[0];
  const showSplit = data.players.some(player => player.mp_sessions !== undefined);
  return (
    <PanelCard
      id={id}
      title="Top players"
      summary={leader ? `${leader.username} leads with ${leader.games_played.toLocaleString()} games` : undefined}
      description={description}
      contentClassName="overflow-x-auto"
    >
      {data.players.length === 0
        ? <EmptyState>Nobody played this game in the selected range.</EmptyState>
        : (
            <ReportTable>
              <ReportHead>
                <Th>#</Th>
                <Th>Player</Th>
                <Th align="right">Played</Th>
                {showSplit && <Th align="right" title="Sessions played alone">Solo</Th>}
                {showSplit && <Th align="right" title="Sessions played in a room against other people">Multiplayer</Th>}
                <Th align="right">Finished</Th>
              </ReportHead>
              <tbody>
                {data.players.map((player, index) => (
                  <ReportRow key={player.user_id}>
                    <Td className="text-muted-foreground">{index + 1}</Td>
                    <Td>
                      <Link href={`/reports/players/${player.user_id}`} className="font-medium text-primary hover:underline">
                        {player.username}
                      </Link>
                    </Td>
                    <Td align="right">{player.games_played.toLocaleString()}</Td>
                    {showSplit && <Td align="right">{(player.games_played - (player.mp_sessions ?? 0)).toLocaleString()}</Td>}
                    {showSplit && <Td align="right">{(player.mp_sessions ?? 0).toLocaleString()}</Td>}
                    <Td align="right">{player.games_finished.toLocaleString()}</Td>
                  </ReportRow>
                ))}
              </tbody>
            </ReportTable>
          )}
    </PanelCard>
  );
}
