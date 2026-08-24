'use client';

import type { NationGapsResponse, NationOrdering } from '@/types/reports';
import Link from 'next/link';
import { NationCrest } from '@/components/analytics/NationCrest';
import { SortableHeader, TableControls } from '@/components/analytics/RankedTable';
import { SearchBox } from '@/components/reports/filters/SearchBox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { nationFootballersHref } from '@/lib/nation-param';

/**
 * Where the catalogue is deepest.
 *
 * Context for the two gap lists below it: those say what cannot be used at
 * all, this says what the games will actually feel like to play. A nation with
 * four footballers is not a gap, but it is not depth either, and only a ranked
 * table shows you where the falloff starts.
 *
 * Paged, sorted and filtered by the server, like the teams table. There are far
 * fewer nations than teams — around 233 against 4,402 — so this is a shorter
 * table, but the sort is the point: reading it by name and reading it by depth
 * are two different questions, and finding one nation among 233 is a third.
 */
export function NationDepth({ data, search, onSearchChange, ordering, onSort, onPageChange, onPageSizeChange, busy }: {
  data: NationGapsResponse;
  search: string;
  onSearchChange: (next: string) => void;
  ordering: NationOrdering;
  onSort: (column: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  /** A request is in flight — the controls stay visible but inert. */
  busy?: boolean;
}) {
  const ranked = data.nations_by_footballers;

  // The BE may not carry the paged shape yet — the repositories deploy
  // independently, and before that this was a capped list with no `page`.
  if (!ranked) {
    return null;
  }

  const offset = (ranked.page - 1) * ranked.limit;

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle>Where the catalogue is deepest</CardTitle>
          <CardDescription>
            Context for the gaps below: this is what the games will actually feel like to play.
            Every row opens that nation's footballers.
          </CardDescription>
        </div>
        {/* ON this card, like the squad-depth one. In the page filter bar it
            would sit with nothing to say which of the three lists it narrows —
            and it narrows only this one. */}
        <SearchBox
          value={search}
          onChange={onSearchChange}
          label="Filter nations in this table"
          placeholder="Name or code…"
          className="w-full shrink-0 sm:w-56"
        />
      </CardHeader>
      <CardContent className="space-y-4">
        {ranked.total === 0
          ? (
              <p className="text-sm text-muted-foreground">
                {search
                  ? `No nation matches "${search}".`
                  : 'No footballers are assigned to a nation yet.'}
              </p>
            )
          : (
              <>
                {/* Its own scroller: the page body must never scroll sideways. */}
                <div className="-mx-2 overflow-x-auto px-2">
                  <table className="w-full min-w-104 text-sm">
                    <thead>
                      <tr className="border-b">
                        <th scope="col" className="w-10 px-2 pb-2 text-right text-xs font-medium text-muted-foreground">
                          #
                        </th>
                        <SortableHeader
                          label="Nation"
                          column="name"
                          ordering={ordering}
                          onSort={onSort}
                          className="text-left"
                        />
                        <SortableHeader
                          label="Footballers"
                          column="footballers"
                          ordering={ordering}
                          onSort={onSort}
                          className="w-32 text-right [&>button]:justify-end"
                        />
                      </tr>
                    </thead>
                    <tbody>
                      {ranked.items.map((row, index) => (
                        <tr key={row.id} className="group border-b border-border/50 last:border-0">
                          {/* Where you are in the table, not in the page. */}
                          <td className="px-2 py-1.5 text-right text-xs text-muted-foreground tabular-nums">
                            {offset + index + 1}
                          </td>
                          <td className="px-2 py-1.5">
                            <Link
                              href={nationFootballersHref(row.id)}
                              className="flex items-center gap-2.5 rounded-md py-0.5"
                            >
                              <NationCrest short={row.short} flag={row.flag} />
                              <span className="min-w-0">
                                <span className="block truncate font-medium text-foreground group-hover:text-primary">
                                  {row.name}
                                </span>
                                <span className="block truncate text-xs text-muted-foreground">
                                  {row.short}
                                </span>
                              </span>
                            </Link>
                          </td>
                          <td className="px-2 py-1.5 text-right text-sm font-semibold text-foreground tabular-nums">
                            {row.footballers.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <TableControls
                  page={ranked.page}
                  pages={ranked.pages}
                  total={ranked.total}
                  pageSize={ranked.limit}
                  shown={ranked.items.length}
                  onPageChange={onPageChange}
                  onPageSizeChange={onPageSizeChange}
                  busy={busy}
                />
              </>
            )}
      </CardContent>
    </Card>
  );
}
