'use client';

import type { RangeState } from '@/lib/report-range';
import { useMemo, useState } from 'react';
import { DataCoverage } from '@/components/analytics/panels/DataCoverage';
import { DifficultyCatalogue } from '@/components/analytics/panels/DifficultyCatalogue';
import { EraAndPools } from '@/components/analytics/panels/EraAndPools';
import { FootballerBreakdown } from '@/components/analytics/panels/FootballerBreakdown';
import { FootballerMatrix } from '@/components/analytics/panels/FootballerMatrix';
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
  const [dimension, setDimension] = useState('nation');
  const [matrixSearch, setMatrixSearch] = useState('');
  const [matrixDifficulty, setMatrixDifficulty] = useState<string | null>(null);
  const [matrixLimit, setMatrixLimit] = useState(PAGE);

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

  const matrix = useReport(
    () => ReportsAPI.getDifficultyMatrix(dimension, matrixLimit, matrixSearch || undefined, matrixDifficulty ?? undefined),
    {},
    enabled,
    'The difficulty matrix endpoint',
    `${dimension}:${matrixLimit}:${matrixSearch}:${matrixDifficulty ?? ''}`,
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

      <SectionHeader
        title="The catalogue by difficulty"
      />

      {/* Three across: the same axis asked three ways, so reading one row of
          cards left to right answers "is this tier big, usable, and current". */}
      <ReportPanel state={state} skeletonClassName="h-80 w-full">
        {data => (
          <div className="grid gap-4 lg:grid-cols-3">
            <DifficultyCatalogue data={data} />
            <FootballerBreakdown data={data} />
          </div>
        )}
      </ReportPanel>

      <SectionHeader
        title="When they played, and who can use them"
      />

      <ReportPanel state={state} skeletonClassName="h-72 w-full">
        {data => (
          <div className="space-y-4">
            <EraAndPools data={data} />
            <ReviewQueue counts={data.review_queue} subject="footballers" />
          </div>
        )}
      </ReportPanel>

      <SectionHeader
        title="The catalogue by nation and team"
      />

      <ReportPanel state={matrix} skeletonClassName="h-[30rem] w-full">
        {matrixData => (
          <FootballerMatrix
            data={matrixData}
            dimension={dimension}
            onDimensionChange={(next) => {
              // Reset the row filters: a search for an Italian club means
              // nothing once the rows are nations.
              setDimension(next);
              setMatrixSearch('');
              setMatrixDifficulty(null);
              setMatrixLimit(PAGE);
            }}
            search={matrixSearch}
            onSearchChange={setMatrixSearch}
            difficulty={matrixDifficulty}
            onDifficultyChange={setMatrixDifficulty}
            expanded={matrixLimit > PAGE}
            onExpand={() => setMatrixLimit(EXPANDED)}
          />
        )}
      </ReportPanel>

      <SectionHeader
        title="Coverage where it is used"
      />

      <ReportPanel state={state} skeletonClassName="h-96 w-full">
        {data => <DataCoverage data={data} />}
      </ReportPanel>
    </AnalyticsShell>
  );
}
