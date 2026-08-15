'use client';

import type { CoverageResponse } from '@/types/reports';
import { MetricInfo } from '@/components/reports/primitives/MetricInfo';
import { MetricRow } from '@/components/reports/primitives/MetricRow';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/primitives/ReportTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * What is missing from the football data, where it is actually used.
 *
 * The served and unserved populations stay apart on purpose. A gap in a row
 * nothing serves costs nothing today, and one percentage across both would be
 * true of neither.
 */

/** At or above this share missing, a check is worth acting on rather than noting. */
const NOTABLE_PCT = 10;

export function DataCoverage({ data }: { data: CoverageResponse }) {
  const worst = data.checks.reduce<number>(
    (highest, check) => Math.max(highest, check.served_missing_pct ?? 0),
    0,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          What is missing where it is used
          <MetricInfo metric="data_coverage" />
        </CardTitle>
        <CardDescription>
          Counted over the footballers actually put in front of players. The bank
          also holds rows nobody has been served, and their gaps cost nothing
          today — they are reported apart rather than averaged in.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 overflow-x-auto">
        <MetricRow
          columns={3}
          metrics={[
            { label: 'Footballers served', value: data.served.toLocaleString(), metric: 'data_coverage' },
            { label: 'Never served', value: data.unserved.toLocaleString() },
            { label: 'Worst gap', value: worst ? `${worst}%` : 'none' },
          ]}
        />

        <ReportTable>
          <ReportHead>
            <Th>Needs</Th>
            <Th align="right" title="Footballers served to players that are missing it">Missing</Th>
            <Th align="right" title="In the bank but never served — a gap that costs nothing today">Unserved</Th>
            <Th>What breaks without it</Th>
          </ReportHead>
          <tbody>
            {data.checks.map(check => (
              <ReportRow key={check.key}>
                <Td strong>{check.label}</Td>
                <Td
                  align="right"
                  strong
                  className={cn(
                    check.served_missing_pct !== null && check.served_missing_pct >= NOTABLE_PCT
                      ? 'text-amber-600 dark:text-amber-500'
                      // A clean check earns its place by being able to say a
                      // thing is fine, so zero is stated rather than blank.
                      : 'text-emerald-600 dark:text-emerald-400',
                  )}
                >
                  {check.served_missing.toLocaleString()}
                  {check.served_missing_pct !== null && (
                    <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                      {`${check.served_missing_pct}%`}
                    </span>
                  )}
                </Td>
                <Td align="right" className="text-muted-foreground">
                  {check.unserved_missing.toLocaleString()}
                </Td>
                {/* The gaps are not equivalent, and a table listing them without
                    saying so invites fixing the cheap one. */}
                <Td className="text-xs text-muted-foreground">{check.breaks}</Td>
              </ReportRow>
            ))}
          </tbody>
        </ReportTable>

        {data.by_difficulty.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            <p className="text-xs font-medium text-muted-foreground">
              Missing pictures by declared difficulty
            </p>
            <ReportTable>
              <ReportHead>
                <Th>Graded</Th>
                <Th align="right">Served</Th>
                <Th align="right">No picture</Th>
              </ReportHead>
              <tbody>
                {data.by_difficulty.map(row => (
                  <ReportRow key={String(row.difficulty)}>
                    <Td strong>
                      {row.difficulty ?? <span className="text-muted-foreground">Not graded</span>}
                    </Td>
                    <Td align="right">{row.served.toLocaleString()}</Td>
                    <Td align="right" className="text-muted-foreground">
                      {`${row.picture.toLocaleString()}${row.served ? ` (${Math.round((row.picture / row.served) * 100)}%)` : ''}`}
                    </Td>
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
