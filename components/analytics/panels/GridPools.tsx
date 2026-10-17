'use client';

import type { GridAnalyticsResponse, GridPoolRow } from '@/types/reports';
import { useState } from 'react';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { PanelCard } from '@/components/reports/primitives/PanelCard';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/primitives/ReportTable';
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
  const mode = row.variation_mode_label ? `${row.variation_mode_label} · ` : '';
  return `${mode}${difficulty}${roster} · ${row.grid_size}`;
}

function poolKey(row: GridPoolRow): string {
  return `${row.board}-${row.variation_mode}-${row.grid_size}-${row.difficulty}-${row.footballer_status}-${row.admin_only}`;
}

const underFloor = (row: GridPoolRow) => row.active < row.target_pool_size;

/** The headline while folded: how many pools are below their floor, across every board. */
export function poolsSummary(pools: GridPoolRow[]): string | undefined {
  if (pools.length === 0) {
    return undefined;
  }
  const under = pools.filter(underFloor).length;
  return under === 0 ? `all ${pools.length} pools stocked` : `${under} of ${pools.length} pools under their floor`;
}

export function GridPools({ data }: { data: GridAnalyticsResponse }) {
  const boards = [...new Map(data.pools.map(row => [row.board, row.board_label])).entries()];
  const [board, setBoard] = useState<string>('global');
  const rows = data.pools.filter(row => row.board === board);
  const underByBoard = new Map<string, number>();
  for (const row of data.pools.filter(underFloor)) {
    underByBoard.set(row.board, (underByBoard.get(row.board) ?? 0) + 1);
  }

  return (
    <PanelCard
      id="grid-stock"
      title="Grid stock"
      summary={poolsSummary(data.pools)}
      description="Ready-to-serve grids per pool against the floor the pool task keeps topped up, for the global board and every country board. Under-floor pools serve slow on-demand starts until the next run; repeated exhaustion means heavy players have played everything. Not filtered by date or by the filters above."
      actions={boards.length > 1 && (
        <select
          aria-label="Board"
          value={board}
          onChange={event => setBoard(event.target.value)}
          className="h-7 rounded-md border bg-background px-2 text-xs"
        >
          {boards.map(([key, label]) => (
            <option key={key} value={key}>
              {`${label}${underByBoard.get(key) ? ` · ${underByBoard.get(key)} under floor` : ''}`}
            </option>
          ))}
        </select>
      )}
      contentClassName="overflow-x-auto"
    >
      {rows.length === 0
        ? <EmptyState>No active pool config for this board.</EmptyState>
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
                {rows.map(row => (
                  <ReportRow key={poolKey(row)}>
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
    </PanelCard>
  );
}
