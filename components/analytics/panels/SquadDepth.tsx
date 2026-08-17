'use client';

import type { TeamSortColumn } from '@/hooks/use-team-table';
import type { TeamGapsResponse, TeamOrdering } from '@/types/reports';
import Link from 'next/link';
import { NationFlag } from '@/components/analytics/NationFlag';
import { TeamCrest } from '@/components/analytics/TeamCrest';
import { SearchBox } from '@/components/reports/filters/SearchBox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataPagination } from '@/components/ui/data-pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TEAM_PAGE_SIZES } from '@/hooks/use-team-table';
import { cn } from '@/lib/utils';

/** What `aria-sort` should say about a column, given what the server sorted by. */
function sortState(ordering: TeamOrdering, column: TeamSortColumn) {
  if (column === 'name') {
    return ordering === 'name' ? ('ascending' as const) : undefined;
  }
  if (ordering === 'players') {
    return 'descending' as const;
  }
  return ordering === 'players_asc' ? ('ascending' as const) : undefined;
}

/** A column heading you can press, marked when it is the one in force. */
function SortableHeader({ label, column, ordering, onSort, className }: {
  label: string;
  column: TeamSortColumn;
  ordering: TeamOrdering;
  onSort: (column: TeamSortColumn) => void;
  className?: string;
}) {
  const state = sortState(ordering, column);
  const arrow = state === 'ascending' ? '↑' : '↓';

  return (
    <th scope="col" aria-sort={state} className={cn('px-2 pb-2 text-xs font-medium', className)}>
      <button
        type="button"
        onClick={() => onSort(column)}
        className={cn(
          'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors',
          state ? 'bg-primary/10 text-foreground ring-1 ring-inset ring-primary/40' : 'text-muted-foreground hover:bg-muted',
        )}
      >
        {label}
        {state && <span aria-hidden className="text-primary">{arrow}</span>}
        <span className="sr-only">
          {state ? '(sorted by this column — press to change)' : '(press to sort by this column)'}
        </span>
      </button>
    </th>
  );
}

/**
 * Teams by squad size — the whole table, a page at a time.
 *
 * It used to be a top ten with a bar scaled against the biggest row on screen,
 * and an "expand to 100" for anyone who wanted more. Across 4,402 teams that
 * bar compares ten rows to the largest of the same ten, which says nothing, and
 * "expand to 100" cannot answer what is on page 40 of 441. So: a real table,
 * ordered and paged by the server, with the count as the figure.
 *
 * Sorting goes back to the API rather than reordering what arrived. Sorting the
 * fetched page would order ten rows out of 4,402 and look broken the moment
 * there is a page two.
 *
 * Every row is a link into `/team-players`, which shows the squad with the
 * years each footballer was there. A ranked list of clubs whose squads you
 * cannot open is a list you can only read.
 */
export function SquadDepth({ data, search, onSearchChange, ordering, onSort, onPageChange, onLimitChange, busy }: {
  data: TeamGapsResponse;
  search: string;
  onSearchChange: (next: string) => void;
  ordering: TeamOrdering;
  onSort: (column: TeamSortColumn) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  /** A request is in flight — the controls stay visible but inert. */
  busy?: boolean;
}) {
  const ranked = data.teams_by_players;

  // The BE may not carry this yet — the repositories deploy independently.
  if (!ranked) {
    return null;
  }

  // The page's place in the whole table, so row one of page five reads as 41.
  const offset = (ranked.page - 1) * ranked.limit;

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle>Teams with the most players</CardTitle>
          <CardDescription>
            Squad size as the catalogue holds it — not a real squad, but everyone ever
            recorded at the club. Every row opens that club's squad.
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
      <CardContent className="space-y-4">
        {ranked.total === 0
          ? (
              <p className="text-sm text-muted-foreground">
                {search ? `No team matches "${search}".` : 'No team has a squad yet.'}
              </p>
            )
          : (
              <>
                {/* Its own scroller: the page body must never scroll sideways. */}
                <div className="-mx-2 overflow-x-auto px-2">
                  <table className="w-full min-w-[26rem] text-sm">
                    <thead>
                      <tr className="border-b">
                        <th scope="col" className="w-10 px-2 pb-2 text-right text-xs font-medium text-muted-foreground">
                          #
                        </th>
                        <SortableHeader
                          label="Team"
                          column="name"
                          ordering={ordering}
                          onSort={onSort}
                          className="text-left"
                        />
                        <SortableHeader
                          label="Players"
                          column="players"
                          ordering={ordering}
                          onSort={onSort}
                          className="w-28 text-right [&>button]:justify-end"
                        />
                      </tr>
                    </thead>
                    <tbody>
                      {ranked.items.map((row, index) => (
                        <tr key={row.id} className="group border-b border-border/50 last:border-0">
                          {/* Where you are in the table, not in the page. */}
                          <td className="px-2 py-1.5 text-right text-xs tabular-nums text-muted-foreground">
                            {offset + index + 1}
                          </td>
                          <td className="px-2 py-1.5">
                            <Link
                              href={`/team-players?teamId=${row.id}`}
                              className="flex items-center gap-2.5 rounded-md py-0.5 transition-colors group-hover:text-primary"
                            >
                              <TeamCrest name={row.name} badge={row.badge} />
                              <span className="min-w-0">
                                <span className="block truncate font-medium text-foreground group-hover:text-primary">
                                  {row.name}
                                </span>
                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                  <NationFlag flag={row.flag} />
                                  <span className="truncate">{row.nation ?? 'No nation'}</span>
                                </span>
                              </span>
                            </Link>
                          </td>
                          <td className="px-2 py-1.5 text-right text-sm font-semibold tabular-nums text-foreground">
                            {row.players.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Rows</span>
                    <Select
                      value={String(ranked.limit)}
                      onValueChange={value => onLimitChange(Number(value))}
                      disabled={busy}
                    >
                      <SelectTrigger aria-label="Rows per page" className="h-8 w-[4.5rem]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEAM_PAGE_SIZES.map(size => (
                          <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <DataPagination
                    currentPage={ranked.page}
                    totalPages={ranked.pages}
                    totalCount={ranked.total}
                    visibleCount={ranked.items.length}
                    onPageChange={onPageChange}
                    disabled={busy}
                  />
                </div>
              </>
            )}
      </CardContent>
    </Card>
  );
}
