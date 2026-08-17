'use client';

import type { QuestionsAnalyticsResponse } from '@/types/reports';
import { useMemo, useState } from 'react';
import { SearchBox } from '@/components/reports/filters/SearchBox';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { MetricInfo } from '@/components/reports/primitives/MetricInfo';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/primitives/ReportTable';
import { Button } from '@/components/ui/button';
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

/** Rows shown before asking for the rest. The BE caps the payload at 40. */
const PAGE = 10;

export function CategoryQuality({ data }: { data: QuestionsAnalyticsResponse }) {
  const { rows, min_answers: minAnswers, categories_measured: measured } = data.categories;
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(false);

  // Filtered and sliced HERE rather than server-side: the payload is already
  // capped at 40 rows, so a round trip per keystroke would buy nothing and cost
  // a spinner. The rows arrive sorted hardest-first, which is this panel's whole
  // job — re-sorting client-side would only let the two disagree.
  const matching = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return needle ? rows.filter(row => row.name.toLowerCase().includes(needle)) : rows;
  }, [rows, search]);
  const visible = expanded ? matching : matching.slice(0, PAGE);

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <CardTitle className="flex items-center gap-2">
            Which categories are hardest
            <MetricInfo metric="category_correct_rate" />
          </CardTitle>
          <CardDescription>
            {`${measured.toLocaleString()} categories were answered at least ${minAnswers} times. The rest of the bank's 2,017 are a handful of questions about one footballer, which is why the list stops here rather than listing them all.`}
            {' Lowest correct rate first — that is the order, not a column you pick.'}
          </CardDescription>
        </div>
        {/* On the card it filters. Narrows the list only; the count above still
            describes the whole measured set. */}
        <SearchBox
          value={search}
          onChange={setSearch}
          label="Filter categories in this table"
          placeholder="Filter these categories…"
          className="w-full shrink-0 sm:w-56"
        />
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {rows.length === 0
          ? (
              <EmptyState hint="Try a wider date range.">
                No category was answered enough times to rate.
              </EmptyState>
            )
          : matching.length === 0
            ? <p className="text-sm text-muted-foreground">{`No category matches "${search}".`}</p>
            : (
                <ReportTable>
                  <ReportHead>
                    <Th>Category</Th>
                    <Th align="right" title="Questions in this category that were answered in the window">Questions</Th>
                    <Th align="right">Answers</Th>
                    <Th align="right">Correct</Th>
                  </ReportHead>
                  <tbody>
                    {visible.map(row => (
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

        {/* Only when there is more. "10 of 10" is noise, and the count describes
            the FILTERED list — saying "of 40" while a search is active would
            offer rows that are not there. */}
        {matching.length > visible.length && (
          <div className="flex items-center gap-3 pt-2">
            <p className="text-xs text-muted-foreground">
              {`Showing ${visible.length} of ${matching.length.toLocaleString()}`}
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-0.5 text-xs"
              onClick={() => setExpanded(true)}
            >
              {`Show ${(matching.length - visible.length).toLocaleString()} more`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
