'use client';

import type { QuestionRow, QuestionsAnalyticsResponse } from '@/types/reports';
import { EmptyState } from '@/components/reports/primitives/EmptyState';
import { MetricInfo } from '@/components/reports/primitives/MetricInfo';
import { MetricRow } from '@/components/reports/primitives/MetricRow';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * What players actually chose, per question.
 *
 * Not a table of correct rates — the admin already had those, and on their own
 * they are ambiguous: a hard question and a mis-keyed one both read as 20%
 * correct. The four options side by side say which.
 *
 * Deliberately NOT the shared `Distribution` primitive. That draws one hue
 * varied by opacity, which is right for ordered bands (under 25%, under 50%)
 * and wrong here — the options are categorical and exactly one of them is the
 * key. The whole point is that one bar is different in kind, not further along
 * a scale.
 */

/** Which answer text each option index refers to, for the row label. */
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

function OptionBar({ option, suspect }: { option: QuestionRow['options'][number]; suspect: boolean }) {
  const pct = option.pct ?? 0;
  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          'w-4 shrink-0 text-xs font-medium tabular-nums',
          option.is_correct ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
        )}
      >
        {OPTION_LABELS[option.option - 1] ?? option.option}
      </span>
      {/* The answer as written, before the bar. A share attached to a letter is
          not something anyone can judge — the question a dominant wrong option
          raises is whether that answer is defensible, and it cannot be asked
          without reading it. */}
      <span
        className={cn(
          'w-0 min-w-32 flex-[2] truncate text-xs',
          option.is_correct ? 'font-medium text-foreground' : 'text-muted-foreground',
        )}
        title={option.text}
      >
        {option.text || '—'}
      </span>
      <span className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <span
          className={cn(
            'block h-full rounded-full',
            option.is_correct
              ? 'bg-emerald-500'
              // Amber, not red: a dominant wrong option is a question to LOOK
              // at, not a confirmed error. Red would claim the key is wrong,
              // which this cannot know — the distractor may be defensible.
              : suspect
                ? 'bg-amber-500'
                : 'bg-muted-foreground/30',
          )}
          style={{ width: `${pct}%` }}
        />
      </span>
      <span className="w-11 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {option.pct === null ? '—' : `${option.pct}%`}
      </span>
    </div>
  );
}

export function QuestionQuality({ data }: { data: QuestionsAnalyticsResponse }) {
  const { rows, min_answers: minAnswers, questions_measured: measured } = data.quality;
  const suspect = data.quality.beaten_by_a_wrong_answer;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          What players actually chose
          <MetricInfo metric="answer_distribution" />
        </CardTitle>
        <CardDescription>
          A correct rate cannot tell a hard question from a mis-keyed one — both
          read as 20% correct. The split can: when most players pick the same
          wrong option, the question is wrong or its distractor is defensible.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <MetricRow
          columns={3}
          metrics={[
            {
              label: 'Need a look',
              value: suspect.toLocaleString(),
              metric: 'beaten_by_a_wrong_answer',
            },
            { label: 'Questions rated', value: measured.toLocaleString() },
            { label: 'Rating needs', value: `${minAnswers} answers` },
          ]}
        />

        {rows.length === 0
          ? (
              <EmptyState hint="Try a wider date range.">
                No question was answered enough times to rate.
              </EmptyState>
            )
          : (
              <ul className="space-y-4">
                {rows.map(row => (
                  <li key={row.question_id} className="space-y-2 rounded-md border p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="min-w-0 flex-1 text-sm font-medium">{row.text}</p>
                      {row.beaten_by_a_wrong_answer && (
                        <span
                          className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                          title="More players chose one wrong option than the keyed answer, by more than chance"
                        >
                          A wrong option won
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      {row.options.map(option => (
                        <OptionBar
                          key={option.option}
                          option={option}
                          suspect={option.option === row.top_wrong_option && row.beaten_by_a_wrong_answer}
                        />
                      ))}
                    </div>

                    <p className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      <span>{`${row.answered.toLocaleString()} answered`}</span>
                      {row.difficulty && <span>{`graded ${row.difficulty.toLowerCase()}`}</span>}
                      {/* Timeouts sit here rather than in the bars: they carry
                          whatever option was highlighted when the clock ran out,
                          so they are not a choice — but a question that times
                          out often may simply be too long to read. */}
                      {row.timeouts > 0 && (
                        <span title="Answers submitted when the clock ran out — not counted as choices above">
                          {/* The count when the share is missing: a question
                              where EVERY answer timed out has no deliberate
                              denominator, and `null%` is worse than a raw
                              number (Copilot on #128). */}
                          {row.timeout_pct === null
                            ? `${row.timeouts.toLocaleString()} ran out of time`
                            : `${row.timeout_pct}% ran out of time`}
                        </span>
                      )}
                    </p>
                  </li>
                ))}
              </ul>
            )}
      </CardContent>
    </Card>
  );
}
