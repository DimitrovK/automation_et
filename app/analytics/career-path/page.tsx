'use client';

import type { RangeState } from '@/lib/report-range';
import { useMemo } from 'react';
import { DifficultyTiers } from '@/components/analytics/panels/DifficultyTiers';
import { FootballerContent } from '@/components/analytics/panels/FootballerContent';
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
 * Career Path content quality — the first dashboard out of the Django admin.
 *
 * It shares the reporting section's primitives and filter bar deliberately, and
 * its own section deliberately. The pieces are the same because a table is a
 * table; the section is separate because the question is different. Reports ask
 * how players are behaving and are read by whoever decides what to build.
 * Analytics ask whether the material is any good and are read by whoever writes
 * it, while they are writing it.
 *
 * No game filter: this page IS one game, and the endpoint rejects the parameter
 * rather than echoing one it cannot apply. The bots toggle IS here and matters
 * more than anywhere else — dummy accounts are the majority of Career Path play,
 * so leaving them in makes an editor read a bot's guesses as a verdict on their
 * own work.
 */
export default function CareerPathAnalyticsPage() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);

  // 90 days, not the usual 30: a footballer needs 20 appearances before its
  // rate is stated, and at this volume a month leaves most of the catalogue
  // below that line and the table mostly withheld.
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
    ReportsAPI.getCareerPathAnalytics,
    params,
    enabled,
    'The Career Path analytics endpoint',
  );

  return (
    <AnalyticsShell
      title="Career Path content"
      description="Which footballers are too hard, which are merely common, and whether the grading means anything."
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
        {data => <FootballerContent data={data} />}
      </ReportPanel>

      {/* After the table, because "which footballer should I look at" is the
          question someone arrives with, and this answers the one they leave
          with: whether the tiers those footballers are graded into mean
          anything in the first place. */}
      <SectionHeader
        title="Whether the tiers hold up"
        description="A grading that does not track what players actually do is decoration."
      />

      <ReportPanel state={state} skeletonClassName="h-64 w-full">
        {data => <DifficultyTiers data={data} />}
      </ReportPanel>
    </AnalyticsShell>
  );
}
