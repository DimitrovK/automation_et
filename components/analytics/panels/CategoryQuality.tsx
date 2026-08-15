'use client';

import type { QuestionsAnalyticsResponse } from '@/types/reports';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { MetricInfo } from '@/components/reports/primitives/MetricInfo';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/primitives/ReportTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Categories ranked by how often players get them wrong.
 *
 * The admin dashboard this replaces ranked them by how many QUIZZES used them,
 * which is a fact about scheduling. This is the level an editor commissions at:
 * nobody writes one question, they write ten about Portsmouth.
 */

/** Below this, a category is harder than the bank's own EXTREME tier. */
const HARD_PCT = 50;

export function CategoryQuality({ data }: { data: QuestionsAnalyticsResponse }) {
  const { rows, min_answers: minAnswers, categories_measured: measured } = data.categories;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Which categories are hardest
          <MetricInfo metric="category_correct_rate" />
        </CardTitle>
        <CardDescription>
          {`${measured.toLocaleString()} categories were answered at least ${minAnswers} times. The rest of the bank's 2,017 are a handful of questions about one footballer, which is why the list stops here rather than listing them all.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {rows.length === 0
          ? (
              <EmptyState hint="Try a wider date range.">
                No category was answered enough times to rate.
              </EmptyState>
            )
          : (
              <ReportTable>
                <ReportHead>
                  <Th>Category</Th>
                  <Th align="right" title="Questions in this category that were answered in the window">Questions</Th>
                  <Th align="right">Answers</Th>
                  <Th align="right">Correct</Th>
                </ReportHead>
                <tbody>
                  {rows.map(row => (
                    <ReportRow key={row.category_id}>
                      <Td strong>{row.name}</Td>
                      {/* Both counts, because they answer different questions.
                          `questions` is what a fix would cost — four is an
                          afternoon, forty is a project — and `questions_answered`
                          is how much of the category the rate is actually about.
                          A question nobody was served is invisible to the rate
                          and still has to be rewritten. */}
                      <Td align="right" className="text-muted-foreground">
                        {row.questions.toLocaleString()}
                        {row.questions_answered < row.questions && (
                          <span className="mt-0.5 block text-xs">
                            {`${row.questions_answered.toLocaleString()} served`}
                          </span>
                        )}
                      </Td>
                      <Td align="right">{row.answers.toLocaleString()}</Td>
                      <Td
                        align="right"
                        strong
                        className={cn(
                          row.correct_pct !== null && row.correct_pct < HARD_PCT
                          && 'text-amber-600 dark:text-amber-500',
                        )}
                      >
                        {row.correct_pct === null ? '—' : `${row.correct_pct}%`}
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
