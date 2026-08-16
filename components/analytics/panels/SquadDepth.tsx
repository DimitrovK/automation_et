'use client';

import type { TeamGapsResponse } from '@/types/reports';
import { CappedList } from '@/components/reports/primitives/CappedList';
import { DataBar } from '@/components/reports/primitives/DataBar';
import { ReportTable } from '@/components/reports/primitives/ReportTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MAGNITUDE_BAR } from '@/lib/data-colours';

/**
 * Teams with the deepest squads.
 *
 * The other end of the same table as the empty-team list below it, and the pair
 * is the point: one says what the catalogue leans on, the other what it forgot.
 *
 * The bar is scaled against the largest team on screen rather than an absolute
 * ceiling, because the question is relative — which of these is deep — and an
 * absolute scale would flatten every row once one team ran away with it.
 */
export function SquadDepth({ data, onExpand, expanded, search }: {
  data: TeamGapsResponse;
  onExpand?: () => void;
  expanded?: boolean;
  search?: string;
}) {
  const ranked = data.teams_by_players;

  // The BE may not carry this yet — the repositories deploy independently.
  if (!ranked) {
    return null;
  }

  const largest = Math.max(...ranked.items.map(row => row.players), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teams with the most players</CardTitle>
        <CardDescription>
          Squad size as the catalogue holds it — not a real squad, but everyone ever
          recorded at the club.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CappedList
          total={ranked.total}
          shown={ranked.items.length}
          onExpand={onExpand}
          expanded={expanded}
          emptyLabel={search ? `No team matches "${search}".` : 'No team has a squad yet.'}
        >
          <ReportTable>
            <thead>
              <tr className="border-b">
                <th className="py-2 pr-4 text-left text-xs font-medium text-muted-foreground">Team</th>
                <th className="py-2 pr-4 text-left text-xs font-medium text-muted-foreground">Nation</th>
                <th className="py-2 pr-4 text-right text-xs font-medium text-muted-foreground">Players</th>
                <th className="w-1/3 py-2 text-left text-xs font-medium text-muted-foreground">
                  <span className="sr-only">Relative squad size</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {ranked.items.map(row => (
                <tr key={`${row.name}-${row.nation ?? ''}`} className="border-b last:border-0">
                  <td className="py-1.5 pr-4 text-sm text-foreground">{row.name}</td>
                  <td className="py-1.5 pr-4 text-xs text-muted-foreground">{row.nation ?? 'No nation'}</td>
                  <td className="py-1.5 pr-4 text-right text-sm font-medium tabular-nums text-foreground">
                    {row.players.toLocaleString()}
                  </td>
                  <td className="py-1.5">
                    <DataBar
                      value={row.players}
                      max={largest}
                      colour={MAGNITUDE_BAR}
                      label={`${row.name}: ${row.players} players`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </ReportTable>
        </CappedList>
      </CardContent>
    </Card>
  );
}
