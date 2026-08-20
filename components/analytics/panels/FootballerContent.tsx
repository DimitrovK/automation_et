'use client';

import type { CareerPathAnalyticsResponse, CareerPathFootballerRow } from '@/types/reports';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { HelperBreakdown } from '@/components/analytics/HelperBreakdown';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { MetricInfo } from '@/components/reports/primitives/MetricInfo';
import { MetricRow } from '@/components/reports/primitives/MetricRow';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/primitives/ReportTable';
import { SmallSampleNotice } from '@/components/reports/primitives/SmallSampleNotice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Which footballers need help, as a rate rather than a count.
 *
 * The admin dashboard this replaces ranked by raw hint count, which puts the
 * most COMMON footballers on top and never surfaces a genuinely broken one that
 * is shown twelve times. The list that exists to find bad content hid it.
 *
 * Four columns on arrival, not seven. It carried a Hints, a Reveals and a Skips
 * column of raw counts, which is the widest part of the table and the least
 * readable part of it: the counts share no denominator, so they cannot be
 * compared to each other or to the rate beside them, and a zero in one of them
 * is ambiguous between "nobody needed it" and "it was never offered". They move
 * into a per-row expansion where each gets the denominator that makes it mean
 * something — see `HelperBreakdown`.
 *
 * So the table answers "who should I look at" and the expansion answers "why,
 * and can I trust it". Scanning fifty rows is the common job; reading one
 * footballer's four helpers is the rarer, deeper one, and it should not cost the
 * first job three columns of width.
 */

/** Above this share needing help, a footballer is worth an editor's attention. */
const NOTABLE_HELP_PCT = 10;

function Rate({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-muted-foreground/70">—</span>;
  }
  return <>{`${value}%`}</>;
}

/**
 * The rate, and the same rate as a length.
 *
 * A column of percentages is read one number at a time; a column of bars is
 * read in one pass, and finding the handful worth opening is exactly a
 * scanning job.
 */
function HelpCell({ value, notable }: { value: number; notable: boolean }) {
  return (
    <span className="inline-flex flex-col items-end gap-1">
      <span className={cn('font-medium tabular-nums', notable && 'text-chart-3')}>{`${value}%`}</span>
      <span aria-hidden className="h-1 w-16 overflow-hidden rounded-full bg-foreground/[0.09]">
        <span
          className={cn('block h-full rounded-full', notable ? 'bg-chart-3' : 'bg-primary/60')}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </span>
    </span>
  );
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
              {row.name}
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
        <Td align="right">{row.appearances.toLocaleString()}</Td>
        <Td align="right">
          {row.below_threshold
            ? <SmallSampleNotice have={row.appearances} need={minAppearances} unit="appearances" />
            : row.help_rate_pct === null
              ? <Rate value={null} />
              : <HelpCell value={row.help_rate_pct} notable={notable} />}
        </Td>
        <Td align="right"><Rate value={row.solve_rate_pct} /></Td>
      </ReportRow>

      {/* Rendered only when open. Four tiles per row across fifty rows is the
          heaviest DOM this page could build, and almost all of it would never
          be looked at — the same reason the answer split on the questions page
          is deferred. */}
      {open && help && (
        <tr className="border-b bg-muted/20 last:border-0">
          <td id={detailId} colSpan={4} className="px-2 py-3">
            <HelperBreakdown help={help} />
          </td>
        </tr>
      )}
    </>
  );
}

export function FootballerContent({ data }: { data: CareerPathAnalyticsResponse }) {
  const { rows, min_appearances: minAppearances, footballers_measured: measured, footballers_seen: seen } = data.content;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Which footballers need help
          <MetricInfo metric="help_rate" />
        </CardTitle>
        <CardDescription>
          A rate, not a count. A footballer shown 200 times and hinted on 10 is
          fine; one shown 12 times and hinted on 10 is broken — and a list ranked
          by count puts the first at the top and never shows the second. Open a
          row to see which of the four helpers players actually reached for.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 overflow-x-auto">
        <MetricRow
          columns={3}
          metrics={[
            { label: 'Footballers rated', value: measured.toLocaleString(), metric: 'help_rate' },
            // Both numbers, because the gap between them is the answer to "why
            // is the one I am looking for missing".
            { label: 'Seen at all', value: seen.toLocaleString() },
            { label: 'Rate needs', value: `${minAppearances} appearances` },
          ]}
        />

        {rows.length === 0
          ? (
              <EmptyState hint="Try a wider date range.">
                No career paths were built in this window.
              </EmptyState>
            )
          : (
              <ReportTable>
                <ReportHead>
                  <Th>Footballer</Th>
                  <Th align="right" title="Times this footballer appeared in a career path">Shown</Th>
                  <Th align="right" title="Share of appearances where the player took a hint, reveal or skip">Needed help</Th>
                  <Th align="right" title="Share of appearances guessed correctly">Solved</Th>
                </ReportHead>
                <tbody>
                  {rows.map(row => (
                    <FootballerRow key={row.footballer_id} row={row} minAppearances={minAppearances} />
                  ))}
                </tbody>
              </ReportTable>
            )}
      </CardContent>
    </Card>
  );
}
