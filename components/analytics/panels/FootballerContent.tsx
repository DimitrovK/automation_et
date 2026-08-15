'use client';

import type { CareerPathAnalyticsResponse } from '@/types/reports';
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
 */

/** Above this share needing help, a footballer is worth an editor's attention. */
const NOTABLE_HELP_PCT = 10;

function Rate({ value }: { value: number | null }) {
  if (value === null) {
    return <span className="text-muted-foreground/70">—</span>;
  }
  return <>{`${value}%`}</>;
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
          by count puts the first at the top and never shows the second.
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
                  <Th align="right">Hints</Th>
                  <Th align="right">Reveals</Th>
                  <Th align="right">Skips</Th>
                </ReportHead>
                <tbody>
                  {rows.map(row => (
                    <ReportRow key={row.footballer_id}>
                      <Td strong>
                        {row.name}
                        {row.declared_difficulty && (
                          // The editor's own grading, beside what players did
                          // with it. A footballer graded EXTREME that everyone
                          // solves is mis-graded one way; one graded EASY that
                          // nobody solves is mis-graded the other, and both are
                          // editorial work rather than a bug.
                          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                            {`graded ${row.declared_difficulty.toLowerCase()}`}
                          </span>
                        )}
                      </Td>
                      <Td align="right">{row.appearances.toLocaleString()}</Td>
                      <Td
                        align="right"
                        strong
                        className={cn(
                          row.help_rate_pct !== null && row.help_rate_pct >= NOTABLE_HELP_PCT
                          && 'text-amber-600 dark:text-amber-500',
                        )}
                      >
                        {row.below_threshold
                          ? <SmallSampleNotice have={row.appearances} need={minAppearances} unit="appearances" />
                          : <Rate value={row.help_rate_pct} />}
                      </Td>
                      <Td align="right"><Rate value={row.solve_rate_pct} /></Td>
                      <Td align="right" className="text-muted-foreground">{row.hints.toLocaleString()}</Td>
                      <Td align="right" className="text-muted-foreground">{row.reveals.toLocaleString()}</Td>
                      <Td align="right" className="text-muted-foreground">{row.skips.toLocaleString()}</Td>
                    </ReportRow>
                  ))}
                </tbody>
              </ReportTable>
            )}
      </CardContent>
    </Card>
  );
}
