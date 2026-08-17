'use client';

import type { TeamGapsResponse } from '@/types/reports';
import { SearchBox } from '@/components/reports/filters/SearchBox';
import { CappedList } from '@/components/reports/primitives/CappedList';
import { DataBar } from '@/components/reports/primitives/DataBar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MAGNITUDE_BAR, MAGNITUDE_TRACK } from '@/lib/data-colours';

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
export function SquadDepth({ data, onExpand, expanded, search, onSearchChange }: {
  data: TeamGapsResponse;
  onExpand?: () => void;
  expanded?: boolean;
  search: string;
  onSearchChange: (next: string) => void;
}) {
  const ranked = data.teams_by_players;

  // The BE may not carry this yet — the repositories deploy independently.
  if (!ranked) {
    return null;
  }

  const largest = Math.max(...ranked.items.map(row => row.players), 1);

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle>Teams with the most players</CardTitle>
          <CardDescription>
            Squad size as the catalogue holds it — not a real squad, but everyone ever
            recorded at the club.
          </CardDescription>
        </div>
        {/* ON this card. In the page filter bar it sat with nothing to say which
            of the two tables it narrowed — and it narrows only this one. */}
        <SearchBox
          value={search}
          onChange={onSearchChange}
          label="Filter teams in this table"
          placeholder="Filter these teams…"
          className="w-full shrink-0 sm:w-56"
        />
      </CardHeader>
      <CardContent>
        <CappedList
          total={ranked.total}
          shown={ranked.items.length}
          onExpand={onExpand}
          expanded={expanded}
          emptyLabel={search ? `No team matches "${search}".` : 'No team has a squad yet.'}
        >
          <ol className="space-y-1.5">
            {ranked.items.map((row, index) => (
              <li
                key={`${row.name}-${row.nation ?? ''}`}
                className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50"
              >
                {/* The rank, because a ranked list should say where you are in
                    it — row four of a hundred reads differently from row four
                    of four. */}
                <span className="w-6 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{row.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {row.nation ?? 'No nation'}
                  </span>
                </span>
                <span className="flex w-1/2 shrink-0 items-center gap-2">
                  <DataBar
                    value={row.players}
                    max={largest}
                    colour={MAGNITUDE_BAR}
                    track={MAGNITUDE_TRACK}
                    label={`${row.name}: ${row.players} players`}
                    className="flex-1"
                  />
                  <span className="w-12 shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">
                    {row.players.toLocaleString()}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </CappedList>
      </CardContent>
    </Card>
  );
}
