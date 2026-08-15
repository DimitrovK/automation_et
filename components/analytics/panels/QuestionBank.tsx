'use client';

import type { QuestionsAnalyticsResponse } from '@/types/reports';
import { MetricInfo } from '@/components/reports/primitives/MetricInfo';
import { ReportHead, ReportRow, ReportTable, Td, Th } from '@/components/reports/primitives/ReportTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Whether the grading works, and whether the bank is running out.
 *
 * The second question is the one that settles an argument: "we need more
 * questions" is either true or it is not, and until now nothing said which.
 */

/**
 * The scale's own order, easiest first — which is NOT what sorting the names
 * gives you. Alphabetically the list runs EASY, EXTREME, HARD, NORMAL, so the
 * hardest tier lands second and the middle one last, and a reader scanning down
 * the column sees a ranking by nothing at all.
 */
const TIER_ORDER = ['EASY', 'NORMAL', 'HARD', 'EXTREME'];

function tierRank(difficulty: string | null): number {
  const index = difficulty === null ? -1 : TIER_ORDER.indexOf(difficulty);
  return index === -1 ? TIER_ORDER.length : index;
}

export function QuestionBank({ data }: { data: QuestionsAnalyticsResponse }) {
  const tiers = [...data.shape.difficulty].sort(
    (a, b) => tierRank(a.difficulty) - tierRank(b.difficulty),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          The bank, and whether its grading works
          <MetricInfo metric="bank_used" />
        </CardTitle>
        <CardDescription>
          {data.shape.bank_used_pct === null
            ? 'No questions in the bank.'
            : `${data.shape.questions_served.toLocaleString()} of ${data.shape.questions_in_bank.toLocaleString()} questions were served in this window — ${data.shape.bank_used_pct}% of the bank.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <ReportTable>
          <ReportHead>
            <Th>Graded</Th>
            <Th align="right">Answered</Th>
            <Th align="right" title="Should fall as the tier gets harder">Correct</Th>
            <Th align="right" title="Answers submitted when the clock ran out">Ran out of time</Th>
          </ReportHead>
          <tbody>
            {tiers.map(tier => (
              <ReportRow key={String(tier.difficulty)}>
                <Td strong>
                  {tier.difficulty ?? <span className="text-muted-foreground">Not graded</span>}
                </Td>
                <Td align="right">{tier.answered.toLocaleString()}</Td>
                <Td align="right" strong>
                  {tier.correct_pct === null ? '—' : `${tier.correct_pct}%`}
                </Td>
                <Td align="right" className="text-muted-foreground">
                  {tier.timeouts.toLocaleString()}
                </Td>
              </ReportRow>
            ))}
          </tbody>
        </ReportTable>
      </CardContent>
    </Card>
  );
}
