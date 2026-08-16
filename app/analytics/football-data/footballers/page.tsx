'use client';

import type { RangeState } from '@/lib/report-range';
import { useMemo, useState } from 'react';
import { DataCoverage } from '@/components/analytics/panels/DataCoverage';
import { DifficultyCatalogue } from '@/components/analytics/panels/DifficultyCatalogue';
import { FootballerBreakdown } from '@/components/analytics/panels/FootballerBreakdown';
import { ReviewQueue } from '@/components/analytics/panels/ReviewQueue';
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

const PAGE = 10;
const EXPANDED = 100;

/**
 * Footballers: the shape of the catalogue, and what is missing from it.
 *
 * The range picker stays because ONE thing here is windowed — coverage is
 * measured among the footballers actually served in the period. The difficulty
 * mix and the contributor list describe the catalogue as it stands and do not
 * move with it, which their own copy says so the picker cannot mislead.
 */
export default function FootballersAnalyticsPage() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);
  const [limit, setLimit] = useState(PAGE);

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
    () => ({ ...rangeToParams(range), include_bots: includeBots, limit }),
    [range, includeBots, limit],
  );

  const state = useReport(
    ReportsAPI.getCoverage,
    params,
    enabled,
    'The football data coverage endpoint',
  );

  return (
    <AnalyticsShell
      title="Footballers"
      description="How the catalogue is shaped, who built it, and what the games cannot use."
    >
      <FilterBar>
        <RangePicker
          value={range}
          onChange={setRange}
          includeBots={includeBots}
          onIncludeBotsChange={setIncludeBots}
        />
      </FilterBar>

      <ReportPanel state={state} skeletonClassName="h-80 w-full">
        {data => <DifficultyCatalogue data={data} />}
      </ReportPanel>

      <SectionHeader
        title="Who built it, and who is still playing"
        description="Not windowed — this is the catalogue as it stands, whatever the range says."
      />

      <ReportPanel state={state} skeletonClassName="h-72 w-full">
        {data => (
          <div className="space-y-4">
            <FootballerBreakdown
              data={data}
              expanded={limit > PAGE}
              onExpand={() => setLimit(EXPANDED)}
            />
            <ReviewQueue counts={data.review_queue} subject="footballers" />
          </div>
        )}
      </ReportPanel>

      <SectionHeader
        title="Coverage where it is used"
        description="Gaps among the footballers actually put in front of players in the window, and the untouched remainder."
      />

      <ReportPanel state={state} skeletonClassName="h-96 w-full">
        {data => <DataCoverage data={data} />}
      </ReportPanel>
    </AnalyticsShell>
  );
}
