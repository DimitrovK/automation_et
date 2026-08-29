'use client';

import type { GridAnalyticsResponse } from '@/types/reports';
import Link from 'next/link';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { MetricInfo } from '@/components/reports/primitives/MetricInfo';
import { MetricRow } from '@/components/reports/primitives/MetricRow';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/primitives/ReportTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { criterionTypeLabel } from '@/lib/criterion-type-label';
import { editFootballerHref } from '@/lib/footballer-links';
import { cn } from '@/lib/utils';

/**
 * Where the help gets spent — Extra Times and skips as suffering signals.
 *
 * The splits carry the meaning, not the totals: a WASTED Extra Time (no
 * open valid cell existed — it bought nothing) is sharper than a used one,
 * and a skip only signals pain when the footballer was placeable —
 * distractor skips are correct play and stay in the summary. On dev data
 * half of all ET uses were wasted, which is exactly the kind of number
 * this panel exists to surface.
 */

/** Above this share of uses wasted, a footballer's row goes amber. */
const NOTABLE_WASTE_PCT = 50;

export function GridAssists({ data }: { data: GridAnalyticsResponse }) {
  const { summary, et_footballers, skip_footballers, et_criteria } = data.assists;
  const nothingSpent = summary.et_used === 0 && summary.deliberate_skips === 0
    && summary.penalty_skips === 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Where the help gets spent
          <MetricInfo metric="grid_et_used" />
        </CardTitle>
        <CardDescription>
          Extra Times and skips, split by what they say: a wasted Extra Time
          bought nothing, a skip only counts as suffering when the footballer
          had a cell to go to — correctly skipped distractors and penalty
          auto-skips are reported, not ranked.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 overflow-x-auto">
        <MetricRow
          columns={4}
          metrics={[
            {
              label: 'Extra Times used',
              value: summary.et_used.toLocaleString(),
              metric: 'grid_et_used',
            },
            {
              label: 'Wasted',
              value: summary.et_used === 0
                ? '—'
                : `${summary.et_wasted.toLocaleString()} (${Math.round((summary.et_wasted / summary.et_used) * 100)}%)`,
            },
            { label: 'ET Hits earned', value: summary.et_hits_earned.toLocaleString() },
            {
              label: 'Typical burn point',
              value: summary.avg_et_position_pct === null
                ? '—'
                : `${summary.avg_et_position_pct}% into the run`,
            },
          ]}
        />
        <MetricRow
          columns={4}
          metrics={[
            {
              label: 'Skips (placeable)',
              value: (summary.deliberate_skips - summary.distractor_skips).toLocaleString(),
              metric: 'grid_skips',
            },
            { label: 'Distractor skips', value: summary.distractor_skips.toLocaleString() },
            { label: 'Penalty auto-skips', value: summary.penalty_skips.toLocaleString() },
            {
              label: 'Sessions helped',
              value: `${summary.sessions_using_et.toLocaleString()} ET · ${summary.sessions_skipping.toLocaleString()} skip`,
            },
          ]}
        />

        {nothingSpent
          ? (
              <EmptyState hint="Try a wider date range.">
                No Extra Time or skip in this window.
              </EmptyState>
            )
          : (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                    Footballers people burn an Extra Time on
                  </h4>
                  <ReportTable>
                    <ReportHead>
                      <Th>Footballer</Th>
                      <Th align="right">ET uses</Th>
                      <Th align="right" title="Uses where no open valid cell existed — the Extra Time bought nothing">Wasted</Th>
                    </ReportHead>
                    <tbody>
                      {et_footballers.map(row => (
                        <ReportRow key={row.footballer_id}>
                          <Td strong>
                            <Link href={editFootballerHref(row.footballer_id)} className="hover:text-primary hover:underline">
                              {row.name}
                            </Link>
                          </Td>
                          <Td align="right">{row.et_uses.toLocaleString()}</Td>
                          <Td
                            align="right"
                            className={cn(
                              row.et_uses > 0
                              && (row.wasted / row.et_uses) * 100 >= NOTABLE_WASTE_PCT
                              && 'text-amber-600 dark:text-amber-500',
                            )}
                          >
                            {row.wasted.toLocaleString()}
                          </Td>
                        </ReportRow>
                      ))}
                    </tbody>
                  </ReportTable>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                    Placeable footballers people skip
                  </h4>
                  <ReportTable>
                    <ReportHead>
                      <Th>Footballer</Th>
                      <Th align="right" title='"Placeable" is judged against the grid — the cell may already have been filled at the moment of the skip'>Skips</Th>
                    </ReportHead>
                    <tbody>
                      {skip_footballers.map(row => (
                        <ReportRow key={row.footballer_id}>
                          <Td strong>
                            <Link href={editFootballerHref(row.footballer_id)} className="hover:text-primary hover:underline">
                              {row.name}
                            </Link>
                          </Td>
                          <Td align="right">{row.skips.toLocaleString()}</Td>
                        </ReportRow>
                      ))}
                    </tbody>
                  </ReportTable>
                </div>
              </div>
            )}

        {et_criteria.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">
              Cells Extra Times had to rescue
            </h4>
            <ReportTable>
              <ReportHead>
                <Th>Criterion</Th>
                <Th>Type</Th>
                <Th align="right" title="ET placements that landed in a cell carrying this criterion">Rescues</Th>
              </ReportHead>
              <tbody>
                {et_criteria.map(row => (
                  <ReportRow key={`${row.criterion_type}:${row.label}`}>
                    <Td strong>{row.label}</Td>
                    <Td className="text-muted-foreground">
                      <span title={row.criterion_type}>{criterionTypeLabel(row.criterion_type)}</span>
                    </Td>
                    <Td align="right">{row.placements.toLocaleString()}</Td>
                  </ReportRow>
                ))}
              </tbody>
            </ReportTable>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
