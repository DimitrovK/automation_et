'use client';

import type { QuestionsAnalyticsResponse } from '@/types/reports';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { MetricInfo } from '@/components/reports/primitives/MetricInfo';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/primitives/ReportTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Which scheduled quizzes ran, and how much they were played.
 *
 * Sorted by total plays because that is what the payload ranks by, but the
 * column that answers "is this quiz any good" is plays per day it was offered —
 * the total mostly measures how often it was scheduled.
 */
export function GlobalQuizUsage({ data }: { data: QuestionsAnalyticsResponse }) {
  const { rows, total_plays: totalPlays } = data.quizzes;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Which quizzes ran
          <MetricInfo metric="quiz_plays_per_day" />
        </CardTitle>
        <CardDescription>
          {`${totalPlays.toLocaleString()} plays across the quizzes scheduled in this window. Read the per-day column rather than the total — the total mostly says how often a quiz was offered.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {rows.length === 0
          ? (
              <EmptyState hint="Try a wider date range.">
                No quiz was scheduled in this window.
              </EmptyState>
            )
          : (
              <ReportTable>
                <ReportHead>
                  <Th>Quiz</Th>
                  <Th align="right" title="Days this quiz was actually offered">Days offered</Th>
                  <Th align="right">Plays</Th>
                  <Th align="right" title="Plays divided by the days it was offered — the comparable figure">Per day</Th>
                </ReportHead>
                <tbody>
                  {rows.map(row => (
                    <ReportRow key={row.quiz_id}>
                      <Td strong>{row.title}</Td>
                      <Td align="right" className="text-muted-foreground">
                        {row.scheduled_days.toLocaleString()}
                      </Td>
                      <Td align="right" className="text-muted-foreground">
                        {row.plays.toLocaleString()}
                      </Td>
                      <Td align="right" strong>
                        {row.plays_per_day === null ? '—' : row.plays_per_day.toLocaleString()}
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
