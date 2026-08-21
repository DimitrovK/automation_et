'use client';

import type { CareerPathAnalyticsResponse, CareerPathFootballerRow, CareerPathOrdering, PlayOutcome } from '@/types/reports';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { HelperBreakdown } from '@/components/analytics/HelperBreakdown';
import { OutcomeBar, OutcomeLegend } from '@/components/analytics/OutcomeBar';
import { SortableHeader, TableControls } from '@/components/analytics/RankedTable';
import { SearchBox } from '@/components/reports/filters/SearchBox';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { MetricInfo } from '@/components/reports/primitives/MetricInfo';
import { MetricRow } from '@/components/reports/primitives/MetricRow';
import { ReportRow, ReportTable, Td, Th } from '@/components/reports/primitives/ReportTable';
import { SmallSampleNotice } from '@/components/reports/primitives/SmallSampleNotice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { careerPathTabHref } from '@/lib/footballer-links';
import { cn } from '@/lib/utils';

/**
 * Which footballers players struggle with, as a rate rather than a count.
 *
 * The admin dashboard this replaces ranked by raw hint count, which puts the
 * most COMMON footballers on top and never surfaces a genuinely broken one that
 * is shown twelve times. The list that exists to find bad content hid it.
 *
 * The unit is a PLAY — one player meeting one footballer once — not an
 * appearance. A path is built before it is played and Ladder serves its
 * footballers in order, so a third of appearances are people nobody reached;
 * counting those made every rate on this table too small. `Played` is the
 * denominator, and `in paths` sits under it when the two differ, because that
 * gap is itself informative: a footballer in forty paths and played six times
 * is buried at the end of long ladders.
 *
 * Each row carries what actually happened as one bar rather than three
 * percentages to hold in your head. "Needed help 25%" means nothing on its own:
 * a footballer solved 95% of the time with a quarter taking hints is working as
 * intended, and one solved 20% of the time with the same help rate is not.
 */

/** Above this share needing help, a footballer is worth an editor's attention. */
const NOTABLE_HELP_PCT = 10;

/** The share of plays that ended with the footballer guessed, however. */
function solvedPct(outcome: PlayOutcome, plays: number) {
  if (!plays) {
    return 0;
  }
  return Math.round(((outcome.solved_unaided + outcome.solved_helped) * 100) / plays);
}

function Rate({ value, suffix = '%' }: { value: number | null | undefined; suffix?: string }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground/70">—</span>;
  }
  return <>{`${value}${suffix}`}</>;
}

function FootballerRow({ row, minAppearances }: {
  row: CareerPathFootballerRow;
  minAppearances: number;
}) {
  const [open, setOpen] = useState(false);
  // A backend that predates the breakdown leaves the row un-openable rather
  // than opening onto nothing. The repositories deploy independently.
  const help = row.help;
  const notable = row.help_rate_pct !== null && row.help_rate_pct >= NOTABLE_HELP_PCT;
  const detailId = `helpers-${row.footballer_id}`;
  const plays = row.plays ?? 0;

  return (
    <>
      <ReportRow className={cn(open && 'bg-muted/40')}>
        <Td strong>
          <span className="flex items-center gap-2">
            {help
              ? (
                  <button
                    type="button"
                    onClick={() => setOpen(value => !value)}
                    aria-expanded={open}
                    aria-controls={detailId}
                    className="-m-1 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} aria-hidden />
                    <span className="sr-only">{`Show how ${row.name} was helped`}</span>
                  </button>
                )
              // Keeps the name column aligned with the rows that do open.
              : <span aria-hidden className="size-4" />}
            <span className="min-w-0">
              {/* Into the footballer's own Career Path record, which answers
                  the question this table cannot: what is wrong with THIS one. */}
              <Link href={careerPathTabHref(row.footballer_id)} className="hover:text-primary hover:underline">
                {row.name}
              </Link>
              {row.declared_difficulty && (
                // The editor's own grading, beside what players did with it. A
                // footballer graded EXTREME that everyone solves is mis-graded
                // one way; one graded EASY that nobody solves is mis-graded the
                // other, and both are editorial work rather than a bug.
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                  {`graded ${row.declared_difficulty.toLowerCase()}`}
                </span>
              )}
            </span>
          </span>
        </Td>
        <Td align="right">
          <span className="tabular-nums">{plays.toLocaleString()}</span>
          {/* Only when it says something. A ladder nobody finished leaves its
              later footballers in paths they were never played from. */}
          {row.in_paths !== undefined && row.in_paths !== plays && (
            <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
              {`in ${row.in_paths.toLocaleString()} paths`}
            </span>
          )}
        </Td>
        <Td className="w-44">
          {row.outcome
            ? (
                // Fixed width and a number under it. Left to size itself the
                // bars came out a different length on every row, which made a
                // column meant to be compared down the page impossible to
                // compare down the page — and a bar with no figure beside it
                // gives the eye nothing to anchor on.
                <span className="flex flex-col gap-1">
                  <OutcomeBar outcome={row.outcome} plays={plays} className="h-2.5" />
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {`${solvedPct(row.outcome, plays)}% solved`}
                  </span>
                </span>
              )
            : <span className="text-muted-foreground/70">—</span>}
        </Td>
        <Td align="right">
          {row.below_threshold
            ? <SmallSampleNotice have={plays} need={minAppearances} unit="plays" />
            : (
                <span className={cn('font-medium tabular-nums', notable && 'text-chart-3')}>
                  <Rate value={row.help_rate_pct} />
                </span>
              )}
        </Td>
        <Td align="right"><Rate value={row.unfinished_pct} /></Td>
        <Td align="right"><Rate value={row.avg_guesses_to_solve} suffix="" /></Td>
      </ReportRow>

      {/* Rendered only when open. Four tiles per row across fifty rows is the
          heaviest DOM this page could build, and almost all of it would never
          be looked at — the same reason the answer split on the questions page
          is deferred. */}
      {open && help && (
        <tr className="border-b bg-muted/20 last:border-0">
          <td id={detailId} colSpan={6} className="px-2 py-3">
            <HelperBreakdown help={help} />
          </td>
        </tr>
      )}
    </>
  );
}

export function FootballerContent({ data, search, onSearchChange, ordering, onSort, onPageChange, onPageSizeChange, busy }: {
  data: CareerPathAnalyticsResponse;
  search: string;
  onSearchChange: (next: string) => void;
  ordering: CareerPathOrdering;
  onSort: (column: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  busy?: boolean;
}) {
  const content = data.content;
  const { rows, min_appearances: minAppearances, footballers_measured: measured, footballers_seen: seen } = content;
  // A backend predating the paging sends neither, and the controls stay off
  // rather than paging a table that is still a top-50 cut.
  const paged = content.page !== undefined && content.pages !== undefined;

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            Which footballers players struggle with
            <MetricInfo metric="help_rate" />
          </CardTitle>
          <CardDescription>
            One row per footballer, measured over PLAYS — one player meeting them once.
            A footballer played 200 times and hinted on 10 is fine; one played 12 times
            and hinted on 10 is broken, and a list ranked by count shows the first and
            hides the second. Open a row for the four helpers, or click a name for that
            footballer's full record.
          </CardDescription>
        </div>
        <SearchBox
          value={search}
          onChange={onSearchChange}
          label="Filter footballers in this table"
          placeholder="Find a footballer…"
          className="w-full shrink-0 sm:w-56"
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <MetricRow
          columns={3}
          metrics={[
            { label: 'Footballers rated', value: measured.toLocaleString(), metric: 'help_rate' },
            // Both numbers, because the gap between them is the answer to "why
            // is the one I am looking for missing".
            { label: 'Played at all', value: seen.toLocaleString() },
            { label: 'Rate needs', value: `${minAppearances} plays` },
          ]}
        />

        {rows.length === 0
          ? (
              <EmptyState hint={search ? 'Try a different name, or a wider date range.' : 'Try a wider date range.'}>
                {search ? `No footballer matches "${search}".` : 'No career paths were played in this window.'}
              </EmptyState>
            )
          : (
              <>
                <OutcomeLegend />
                <div className="overflow-x-auto">
                  <ReportTable>
                    <thead>
                      <tr className="border-b">
                        <SortableHeader label="Footballer" column="name" ordering={ordering} onSort={onSort} className="text-left" />
                        <SortableHeader label="Played" column="plays" ordering={ordering} onSort={onSort} className="text-right [&>button]:justify-end" />
                        <Th className="w-44">What happened</Th>
                        <SortableHeader label="Needed help" column="help" ordering={ordering} onSort={onSort} className="text-right [&>button]:justify-end" />
                        <SortableHeader label="Unfinished" column="unfinished" ordering={ordering} onSort={onSort} className="text-right [&>button]:justify-end" />
                        <SortableHeader label="Guesses" column="guesses" ordering={ordering} onSort={onSort} className="text-right [&>button]:justify-end" />
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map(row => (
                        <FootballerRow key={row.footballer_id} row={row} minAppearances={minAppearances} />
                      ))}
                    </tbody>
                  </ReportTable>
                </div>

                {paged && (
                  <TableControls
                    page={content.page!}
                    pages={content.pages!}
                    total={content.total ?? seen}
                    pageSize={content.limit ?? rows.length}
                    shown={rows.length}
                    onPageChange={onPageChange}
                    onPageSizeChange={onPageSizeChange}
                    busy={busy}
                  />
                )}
              </>
            )}
      </CardContent>
    </Card>
  );
}
