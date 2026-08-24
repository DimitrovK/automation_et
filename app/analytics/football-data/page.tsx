'use client';

import type { RangeState } from '@/lib/report-range';
import { useMemo } from 'react';
import { CatalogueGrowth } from '@/components/analytics/panels/CatalogueGrowth';
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
 * Football data — the overview, and the one page here that is about a window.
 *
 * It earns its own destination rather than folding in because every game reads
 * this data: a gap here is not a Career Path problem or a Scout problem, it is
 * both. And the answer it produces is "go and add data" rather than "go and
 * rewrite content", which is a different job for a different person.
 *
 * The detail moved to Footballers, Nations and Teams when this page reached
 * nine sections. What stays is the question you arrive with — is anyone still
 * adding to this — and the three entity pages answer "what is missing where".
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
      description="What the games are missing, and whether anyone is still filling it in."
    >
      <FilterBar>
        <RangePicker
          value={range}
          onChange={setRange}
          includeBots={includeBots}
          onIncludeBotsChange={setIncludeBots}
        />
      </FilterBar>

      <ReportPanel state={state} skeletonClassName="h-112 w-full">
        {data => <CatalogueGrowth data={data} />}
      </ReportPanel>
    </AnalyticsShell>
  );
}
