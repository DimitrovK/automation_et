'use client';

import type { NationGapsResponse, NationOrdering } from '@/types/reports';
import Link from 'next/link';
import { NationCrest } from '@/components/analytics/NationCrest';
import { SortableHeader, TableControls } from '@/components/analytics/RankedTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { nationFootballersHref } from '@/lib/nation-param';

/**
 * Where the catalogue is deepest.
 *
 * Context for the two gap lists beside it: those say what cannot be used at
 * all, this says what the games will actually feel like to play. A nation with
 * four footballers is not a gap, but it is not depth either, and only a ranked
 * table shows you where the falloff starts.
 *
 * Paged and sorted by the server, like the teams table. There are far fewer
 * nations than teams — around 233 against 4,402 — so this is a shorter table,
 * but the sort is the point: reading it by name and reading it by depth are two
 * different questions.
 */
export function NationDepth({ data, ordering, onSort, onPageChange, onPageSizeChange, busy }: {
  data: NationGapsResponse;
  ordering: NationOrdering;
  onSort: (column: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
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
      <CardHeader>
        <CardTitle>Where the catalogue is deepest</CardTitle>
        <CardDescription>
          Context for the gaps above: this is what the games will actually feel like to play.
          Every row opens that nation's footballers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {ranked.total === 0
          ? (
              <p className="text-sm text-muted-foreground">
                No footballers are assigned to a nation yet.
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
                          <td className="px-2 py-1.5 text-right text-xs tabular-nums text-muted-foreground">
                            {offset + index + 1}
                          </td>
                          <td className="px-2 py-1.5">
                            <Link
                              href={nationFootballersHref(row.short)}
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
                          <td className="px-2 py-1.5 text-right text-sm font-semibold tabular-nums text-foreground">
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
