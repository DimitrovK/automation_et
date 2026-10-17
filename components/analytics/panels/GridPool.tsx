'use client';

import type { GridAnalyticsResponse } from '@/types/reports';
import Link from 'next/link';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { MetricInfo } from '@/components/reports/primitives/MetricInfo';
import { PanelCard } from '@/components/reports/primitives/PanelCard';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/primitives/ReportTable';
import { editFootballerHref } from '@/lib/footballer-links';
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

/** The headline while folded: how many pool footballers look broken or dead. */
function footballersSummary(data: GridAnalyticsResponse): string | undefined {
  if (data.footballers.length === 0) {
    return undefined;
  }
  const broken = data.footballers.filter(row => row.wrong_pct >= NOTABLE_WRONG_PCT).length;
  const dead = data.footballers.filter(row => row.skip_pct >= NOTABLE_SKIP_PCT).length;
  if (broken === 0 && dead === 0) {
    return `${data.footballers.length} footballers, none flagged`;
  }
  return [broken && `${broken} often misplaced`, dead && `${dead} mostly skipped`].filter(Boolean).join(' · ');
}

export function GridPool({ data }: { data: GridAnalyticsResponse }) {
  return (
    <PanelCard
      id="grid-footballers"
      title="The footballer pool"
      info={<MetricInfo metric="grid_shown" />}
      summary={footballersSummary(data)}
      description={(
        <>
          Placeable appearances a player decided on — placed, misplaced or
          deliberately skipped. High wrong rate reads as a data bug or an
          unguessably obscure career; high skip rate reads as dead weight.
          Bait counts wrong guesses at distractor appearances (no valid cell
          existed) and stays out of every rate. Ordered worst first.
        </>
      )}
      contentClassName="overflow-x-auto"
    >
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
                <Th align="right" title="Wrong guesses at distractor appearances — wrong by construction, excluded from the rates">Bait</Th>
                <Th align="right" title="Wrong placements as a share of shown (placeable decisions)">Wrong rate</Th>
                <Th align="right" title="Deliberate skips as a share of shown">Skip rate</Th>
              </ReportHead>
              <tbody>
                {data.footballers.map(row => (
                  <ReportRow key={row.footballer_id}>
                    {/* A worklist row's endpoint is the edit form: a high
                          wrong rate is usually a career-data gap, and the fix
                          lives there — same click Career Path names offer. */}
                    <Td strong>
                      <Link href={editFootballerHref(row.footballer_id)} className="hover:text-primary hover:underline">
                        {row.name}
                      </Link>
                    </Td>
                    <Td align="right">{row.shown.toLocaleString()}</Td>
                    <Td align="right">{row.placed.toLocaleString()}</Td>
                    <Td align="right">{row.wrong.toLocaleString()}</Td>
                    <Td align="right">{row.skipped.toLocaleString()}</Td>
                    <Td align="right" className="text-muted-foreground">{row.bait_guesses.toLocaleString()}</Td>
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
    </PanelCard>
  );
}
