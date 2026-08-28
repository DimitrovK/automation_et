'use client';

import type { GridAnalyticsResponse } from '@/types/reports';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { MetricInfo } from '@/components/reports/primitives/MetricInfo';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/primitives/ReportTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Pool footballers by outcome — the most displayed players and what
 * happened when they appeared.
 *
 * Two different problems surface in one table: a footballer everyone
 * places WRONGLY is a data bug (their career says they fit a cell they
 * don't, or vice versa), while one everyone SKIPS is dead weight nobody
 * can use. Both are fixes to the pool, not to any grid.
 */

/** At or above this wrong rate a footballer smells like a data bug. */
const NOTABLE_WRONG_PCT = 50;

/** At or above this skip rate a footballer is dead weight in the pool. */
const NOTABLE_SKIP_PCT = 60;

export function GridPool({ data }: { data: GridAnalyticsResponse }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          The footballer pool
          <MetricInfo metric="grid_shown" />
        </CardTitle>
        <CardDescription>
          Every appearance a player decided on — placed, misplaced or
          deliberately skipped. High wrong rate reads as a data bug; high skip
          rate reads as dead weight. Ordered worst first.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {data.footballers.length === 0
          ? (
              <EmptyState hint="A footballer needs 25 decided appearances before their split is stated.">
                Nothing crossed the volume threshold in this window.
              </EmptyState>
            )
          : (
              <ReportTable>
                <ReportHead>
                  <Th>Footballer</Th>
                  <Th align="right" title="Appearances a player decided on: placement or deliberate skip">Shown</Th>
                  <Th align="right">Placed</Th>
                  <Th align="right">Wrong</Th>
                  <Th align="right">Skipped</Th>
                  <Th align="right" title="Wrong placements as a share of shown">Wrong rate</Th>
                  <Th align="right" title="Deliberate skips as a share of shown">Skip rate</Th>
                </ReportHead>
                <tbody>
                  {data.footballers.map(row => (
                    <ReportRow key={row.footballer_id}>
                      <Td strong>{row.name}</Td>
                      <Td align="right">{row.shown.toLocaleString()}</Td>
                      <Td align="right">{row.placed.toLocaleString()}</Td>
                      <Td align="right">{row.wrong.toLocaleString()}</Td>
                      <Td align="right">{row.skipped.toLocaleString()}</Td>
                      <Td
                        align="right"
                        strong
                        className={cn(
                          row.wrong_pct >= NOTABLE_WRONG_PCT && 'text-amber-600 dark:text-amber-500',
                        )}
                      >
                        {`${row.wrong_pct}%`}
                      </Td>
                      <Td
                        align="right"
                        className={cn(
                          row.skip_pct >= NOTABLE_SKIP_PCT && 'text-amber-600 dark:text-amber-500',
                        )}
                      >
                        {`${row.skip_pct}%`}
                      </Td>
                    </ReportRow>
                  ))}
                </tbody>
              </ReportTable>
            )}
      </CardContent>
    </Card>
  );
}
