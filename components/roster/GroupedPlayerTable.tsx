'use client';

import type { GroupedPlayer } from '@/types/team';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { PlayerTable } from '@/components/team-players/PlayerTable';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

/** "2013–2021", or the single year when that is all there is. */
function span(first: number | null, last: number | null) {
  if (first === null && last === null) {
    return '—';
  }
  if (first === null || last === null || first === last) {
    return String(first ?? last);
  }
  return `${first}–${last}`;
}

function GroupedRow({ player }: { player: GroupedPlayer }) {
  const [open, setOpen] = useState(false);
  const detailId = `spells-${player.footballer_id}`;
  const spellCount = player.spell_count ?? player.spells?.length ?? 0;
  // One club is its own answer — an expander that reveals a single row the
  // summary already described is a control that wastes a click.
  const expandable = spellCount > 1 && (player.spells?.length ?? 0) > 0;

  return (
    <>
      <TableRow className={cn(open && 'bg-muted/40')}>
        <TableCell className="font-medium">
          <span className="flex items-center gap-2">
            {expandable
              ? (
                  <button
                    type="button"
                    onClick={() => setOpen(value => !value)}
                    aria-expanded={open}
                    aria-controls={detailId}
                    className="-m-1 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} aria-hidden />
                    <span className="sr-only">{`Show the clubs ${player.full_name} played for`}</span>
                  </button>
                )
              : <span aria-hidden className="size-4" />}
            <span className="min-w-0">
              {player.full_name}
              {player.nation_name && (
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                  {player.nation_name}
                </span>
              )}
            </span>
          </span>
        </TableCell>
        <TableCell>
          {/* The number the expander opens, said before it is opened. */}
          <Badge variant="secondary" className="font-normal">
            {`${spellCount} ${spellCount === 1 ? 'club' : 'clubs'}`}
          </Badge>
        </TableCell>
        <TableCell className="tabular-nums">{span(player.first_year, player.last_year)}</TableCell>
        {/* Coalesced rather than trusted. This component is exported, and a
            row arriving without its aggregates should degrade to a dash, never
            take the page down with a TypeError mid-render. */}
        <TableCell className="text-right tabular-nums">{(player.total_apps ?? 0).toLocaleString()}</TableCell>
        <TableCell className="text-right tabular-nums">{(player.total_goals ?? 0).toLocaleString()}</TableCell>
        <TableCell>
          <span className="flex flex-wrap items-center gap-1">
            {/* An open spell — no end year — means they are at a club here now,
                which is a different fact from not having retired. */}
            {(player.open_spells ?? 0) > 0 && (
              <Badge className="bg-emerald-100 font-normal text-emerald-900 hover:bg-emerald-100 dark:bg-emerald-900/50 dark:text-emerald-100">
                Still there
              </Badge>
            )}
            {player.retired
              ? <Badge variant="outline" className="font-normal">Retired</Badge>
              : <span className="text-xs text-muted-foreground">Active</span>}
          </span>
        </TableCell>
      </TableRow>

      {/* Rendered only when open. Fifty rows each holding a nested table is the
          heaviest thing this page could build, and almost none of it would be
          looked at. */}
      {open && (
        <TableRow className="bg-muted/20 hover:bg-muted/20">
          <TableCell id={detailId} colSpan={6} className="p-3">
            {/* The club is the whole point of this table, and the player and
                nation are the same on every row of it — the row above already
                said who. */}
            <PlayerTable players={player.spells ?? []} showTeam showPlayer={false} />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

/**
 * A roster as people rather than spells.
 *
 * A footballer with eleven clubs in one country is eleven rows of the same name
 * in the ungrouped view, which is a list of contracts rather than a list of
 * players. Here they are one row that says "11 clubs" and opens onto them.
 *
 * The totals are summed across the spells IN SCOPE, so "most apps in England"
 * is every English club added together and excludes the Italian ones.
 */
export function GroupedPlayerTable({ players, emptyLabel }: {
  players: GroupedPlayer[];
  emptyLabel?: string;
}) {
  if (players.length === 0) {
    return (
      <div className="rounded-md border p-8 text-center text-sm text-muted-foreground">
        {emptyLabel ?? 'No footballer matches the current filters.'}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Footballer</TableHead>
            <TableHead>Clubs here</TableHead>
            <TableHead>Years</TableHead>
            <TableHead className="text-right">Apps</TableHead>
            <TableHead className="text-right">Goals</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {players.map(player => (
            <GroupedRow key={player.footballer_id} player={player} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
