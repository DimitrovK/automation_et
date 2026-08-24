'use client';

import type { RangeState } from '@/lib/report-range';
import { useMemo, useState } from 'react';
import { CategoryMatrix } from '@/components/analytics/panels/CategoryMatrix';
import { CategoryQuality } from '@/components/analytics/panels/CategoryQuality';
import { GlobalQuizUsage } from '@/components/analytics/panels/GlobalQuizUsage';
import { QuestionBank } from '@/components/analytics/panels/QuestionBank';
import { QuestionCatalogue } from '@/components/analytics/panels/QuestionCatalogue';
import { QuestionQuality } from '@/components/analytics/panels/QuestionQuality';
import { AnalyticsShell } from '@/components/analytics/shell/AnalyticsShell';
import { FilterBar } from '@/components/reports/filters/FilterBar';
import { RangePicker } from '@/components/reports/filters/RangePicker';
import { ReportPanel } from '@/components/reports/primitives/ReportPanel';
import { SectionHeader } from '@/components/reports/primitives/SectionHeader';
import { useReport } from '@/hooks/use-report';
import { useReportFilters } from '@/hooks/use-report-filters';
import { useAuth } from '@/lib/auth';
import { rangeToParams } from '@/lib/report-range';
import { ReportsAPI } from '@/lib/reports-api';

/**
 * The quiz question bank, under Football Data.
 *
 * It belongs here rather than beside the game reports because it is the same
 * question this section asks of every other table — how much material exists,
 * and where is it thin — of the question bank instead of the footballers.
 *
 * Two halves in a deliberate order. The catalogue leads: how big the bank is,
 * what arrived, and how the categories are shaped. The quality worklist follows,
 * because "which questions are broken" is a different afternoon from "what do we
 * have", and the person who came for one rarely wants the other first.
 */
const PAGE = 10;
const EXPANDED = 100;

export default function QuestionsAnalyticsPage() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);

  // 90 days: a question needs 30 answers before its distribution says anything,
  // and a 30-day window leaves most of a 7,000-question bank under that line.
  const { filters, update } = useReportFilters({
    range: { window: 90 },
    includeBots: false,
    game: null,
    metric: 'games_started',
  });
  const { range, includeBots } = filters;
  const setRange = (next: RangeState) => update({ range: next });
  const setIncludeBots = (next: boolean) => update({ includeBots: next });
  const params = useMemo(
    () => ({ ...rangeToParams(range), include_bots: includeBots }),
    [range, includeBots],
  );

  const [limit, setLimit] = useState(PAGE);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<string | null>(null);

  const bank = useReport(
    () => ReportsAPI.getQuestionBank({ ...params, limit, search: search || undefined, difficulty: difficulty ?? undefined }),
    params,
    enabled,
    'The question bank endpoint',
    `${limit}:${search}:${difficulty ?? ''}`,
  );

  const state = useReport(
    ReportsAPI.getQuestionsAnalytics,
    params,
    enabled,
    'The questions analytics endpoint',
  );

  return (
    <AnalyticsShell
      title="Questions"
      description="How big the question bank is, how it is shaped, and which questions are broken."
    >
      <FilterBar>
        <RangePicker
          value={range}
          onChange={setRange}
          includeBots={includeBots}
          onIncludeBotsChange={setIncludeBots}
        />
      </FilterBar>

      <ReportPanel state={bank} skeletonClassName="h-104 w-full">
        {data => <QuestionCatalogue data={data} />}
      </ReportPanel>

      <ReportPanel state={bank} skeletonClassName="h-96 w-full">
        {data => (
          <CategoryMatrix
            data={data}
            search={search}
            onSearchChange={setSearch}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            expanded={limit > PAGE}
            onExpand={() => setLimit(EXPANDED)}
          />
        )}
      </ReportPanel>

      <SectionHeader
        title="Which questions are broken"
        description="A worklist: the handful worth an afternoon, rather than the bank as a whole."
      />

      <ReportPanel state={state} skeletonClassName="h-96 w-full">
        {data => <QuestionQuality data={data} />}
      </ReportPanel>

      {/* Underneath, because it answers the question the list raises rather than
          the one someone arrives with: is this a few bad questions, or is the
          whole bank mis-graded? */}
      <SectionHeader
        title="The bank as a whole"
        description="Whether the grading separates anything, and whether there is material left."
      />

      <ReportPanel state={state} skeletonClassName="h-64 w-full">
        {data => <QuestionBank data={data} />}
      </ReportPanel>

      {/* The Quiz dashboard's content half, folded in here rather than given its
          own destination (#1475). Its other half was top players by quizzes
          played, which is Reports and better there. Two panels about this same
          bank do not earn a nav entry — the argument R4 used to cut the
          reporting nav from ten destinations to six. */}
      <SectionHeader
        title="Categories and what ran"
        description="Where the bank is weakest by subject, and which scheduled quizzes people actually played."
      />

      <ReportPanel state={state} skeletonClassName="h-80 w-full">
        {data => <CategoryQuality data={data} />}
      </ReportPanel>

      <ReportPanel state={state} skeletonClassName="h-64 w-full">
        {data => <GlobalQuizUsage data={data} />}
      </ReportPanel>
    </AnalyticsShell>
  );
}
