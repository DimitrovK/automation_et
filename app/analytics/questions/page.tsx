'use client';

import type { RangeState } from '@/lib/report-range';
import { useMemo } from 'react';
import { QuestionBank } from '@/components/analytics/panels/QuestionBank';
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
 * Question quality — a worklist, not a dashboard.
 *
 * Someone opens this to find the handful of questions worth an afternoon, so
 * the suspect ones lead and the bank-level view sits underneath. The reverse
 * order would make them scroll past four rows of aggregate to reach the only
 * part they can act on.
 */
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

  const state = useReport(
    ReportsAPI.getQuestionsAnalytics,
    params,
    enabled,
    'The questions analytics endpoint',
  );

  return (
    <AnalyticsShell
      title="Question quality"
      description="Which questions are broken, and how — read from what players chose, not just whether they were right."
    >
      <FilterBar>
        <RangePicker
          value={range}
          onChange={setRange}
          includeBots={includeBots}
          onIncludeBotsChange={setIncludeBots}
        />
      </FilterBar>

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
    </AnalyticsShell>
  );
}
