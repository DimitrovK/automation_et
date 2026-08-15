'use client';

import type { RangeState } from '@/lib/report-range';
import { useMemo } from 'react';
import { DataCoverage } from '@/components/analytics/panels/DataCoverage';
import { AnalyticsShell } from '@/components/analytics/shell/AnalyticsShell';
import { FilterBar } from '@/components/reports/filters/FilterBar';
import { RangePicker } from '@/components/reports/filters/RangePicker';
import { ReportPanel } from '@/components/reports/primitives/ReportPanel';
import { useReport } from '@/hooks/use-report';
import { useReportFilters } from '@/hooks/use-report-filters';
import { useAuth } from '@/lib/auth';
import { rangeToParams } from '@/lib/report-range';
import { ReportsAPI } from '@/lib/reports-api';

/**
 * Football data completeness — the one analytics page that is not about a game.
 *
 * It earns its own destination rather than folding in because every game reads
 * this data: a gap here is not a Career Path problem or a Scout problem, it is
 * both. And the answer it produces is "go and add data" rather than "go and
 * rewrite content", which is a different job for a different person.
 */
export default function FootballDataAnalyticsPage() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);

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
    ReportsAPI.getCoverage,
    params,
    enabled,
    'The football data coverage endpoint',
  );

  return (
    <AnalyticsShell
      title="Football data"
      description="What the games are missing, counted where it is actually used."
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
        {data => <DataCoverage data={data} />}
      </ReportPanel>
    </AnalyticsShell>
  );
}
