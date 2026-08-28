'use client';

import type { GridAnalyticsResponse, GridPoolRow } from '@/types/reports';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/primitives/ReportTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Whether every composed mode is actually stocked.
 *
 * A bucket under its floor serves slow on-demand starts until the next
 * pre-generation tick catches up; a bucket that keeps exhausting is one
 * its heavy players have outgrown. Both were only visible in the Django
 * admin before this table — and an EMPTY bucket is the finding this
 * table exists to surface, so nothing is hidden for being zero.
 *
 * Current state, not windowed: the page's range picker deliberately does
 * not apply here.
 */

function bucketLabel(row: GridPoolRow): string {
  const difficulty = row.difficulty === 'EASY'
    ? 'Standard'
    : row.difficulty === 'HARD'
      ? 'Hard'
      : row.difficulty ?? 'Any';
  const roster = row.footballer_status === 'ACTIVE'
    ? ' · Active'
    : row.footballer_status === 'NOT_ACTIVE'
      ? ' · Retired'
      : '';
  const variation = row.variation ? ` · ${row.variation}` : '';
  return `${difficulty}${roster} · ${row.grid_size}${variation}`;
}

export function GridPools({ data }: { data: GridAnalyticsResponse }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pool stock</CardTitle>
        <CardDescription>
          Ready-to-serve grids per active pre-generation bucket, against the
          floor the beat task keeps topped up. Under-floor buckets serve slow
          on-demand starts until the next tick; repeated exhaustion means the
          heavy players have played everything. Unaffected by the date range.
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {data.pools.length === 0
          ? <EmptyState>No active pre-generation config.</EmptyState>
          : (
              <ReportTable>
                <ReportHead>
                  <Th>Bucket</Th>
                  <Th align="right" title="Pool-active grids vs the floor the beat task tops up to">Stock / floor</Th>
                  <Th align="right" title="Ceiling on pool-active grids">Max</Th>
                  <Th align="right" title="Rotated out — still playable for existing sessions">Retired</Th>
                  <Th align="right" title="Times a player had played every grid in the pool">Exhausted</Th>
                  <Th>Sizing</Th>
                </ReportHead>
                <tbody>
                  {data.pools.map(row => (
                    <ReportRow key={`${row.grid_size}-${row.difficulty}-${row.footballer_status}-${row.variation ?? ''}-${row.admin_only}`}>
                      <Td strong>
                        {bucketLabel(row)}
                        {row.admin_only && (
                          <span className="ml-1.5 text-xs font-normal text-muted-foreground">test pool</span>
                        )}
                      </Td>
                      <Td
                        align="right"
                        strong
                        className={cn(
                          row.active < row.target_pool_size
                          && 'text-amber-600 dark:text-amber-500',
                        )}
                      >
                        {`${row.active} / ${row.target_pool_size}`}
                      </Td>
                      <Td align="right">{row.max_pool_size}</Td>
                      <Td align="right" className="text-muted-foreground">{row.retired.toLocaleString()}</Td>
                      <Td align="right">
                        {row.exhausted_count.toLocaleString()}
                        {row.last_exhausted_at && (
                          <span className="ml-1.5 text-xs text-muted-foreground">
                            {`last ${row.last_exhausted_at.slice(0, 10)}`}
                          </span>
                        )}
                      </Td>
                      <Td className="text-muted-foreground">
                        {row.auto_size_enabled ? 'auto' : 'pinned'}
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
