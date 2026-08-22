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
import { useReport } from '@/hooks/use-report';
import { useReportFilters } from '@/hooks/use-report-filters';
import { useAuth } from '@/lib/auth';
import { rangeToParams } from '@/lib/report-range';
import { ReportsAPI } from '@/lib/reports-api';

/** One cut, so the panel drops its group-by toggle. */
const CLUB_DIMENSION = [{ key: 'club_nation', label: 'By country played in' }];

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

  // The club-nation cut has its own state rather than sharing the matrix
  // toggle's. It answers a different question and is read alongside the first
  // table, not instead of it — a shared filter would clear one while reading
  // the other.
  const [clubSearch, setClubSearch] = useState('');
  const [clubDifficulty, setClubDifficulty] = useState<string | null>(null);
  const [clubLimit, setClubLimit] = useState(PAGE);

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

  const clubMatrix = useReport(
    () => ReportsAPI.getDifficultyMatrix(
      'club_nation',
      clubLimit,
      clubSearch || undefined,
      clubDifficulty ?? undefined,
    ),
    {},
    enabled,
    'The difficulty matrix endpoint',
    `club_nation:${clubLimit}:${clubSearch}:${clubDifficulty ?? ''}`,
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

      <ReportPanel state={state} skeletonClassName="h-80 w-full">
        {data => (
          <div className="grid gap-4 lg:grid-cols-2">
            <DifficultyCatalogue data={data} />
          </div>
        )}
      </ReportPanel>

      <ReportPanel state={state} skeletonClassName="h-72 w-full">
        {data => (
          <div className="space-y-4">
            {/* Three across: era, pools and career state all describe WHO the
                catalogue holds rather than how much of it there is. */}
            <div className="grid gap-4 lg:grid-cols-3">
              <EraAndPools data={data} />
              <FootballerBreakdown data={data} />
            </div>
            <ReviewQueue counts={data.review_queue} subject="footballers" />
          </div>
        )}
      </ReportPanel>

      <ReportPanel state={matrix} skeletonClassName="h-[30rem] w-full">
        {matrixData => (
          <FootballerMatrix
            data={matrixData}
            // Nationality rows lead to the footballer list filtered by it;
            // the by-country table below leads to the roster instead.
            rowHref={dimension === 'nation' ? row => `/footballer-management?nation=${row.key}` : undefined}
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

      <ReportPanel state={clubMatrix} skeletonClassName="h-[30rem] w-full">
        {clubData => (
          <FootballerMatrix
            data={clubData}
            title="Footballers by the country they played in"
            description="Distinct footballers with at least one club in each country, by difficulty. A different question from the table above: the catalogue is thick with Brazilians and thin on anyone who played in Brazil, and a club-based game only cares about the second. Someone who played in England and Italy is in both rows, so these sum to more than the catalogue holds. Approved footballers only."
            palette="deep"
            // Every row opens the roster behind the number.
            rowHref={row => `/nation-players?nationId=${row.key}`}
            dimension="club_nation"
            onDimensionChange={() => {}}
            dimensions={CLUB_DIMENSION}
            search={clubSearch}
            onSearchChange={setClubSearch}
            difficulty={clubDifficulty}
            onDifficultyChange={setClubDifficulty}
            expanded={clubLimit > PAGE}
            onExpand={() => setClubLimit(EXPANDED)}
          />
        )}
      </ReportPanel>

      <ReportPanel state={state} skeletonClassName="h-96 w-full">
        {data => <DataCoverage data={data} />}
      </ReportPanel>
    </AnalyticsShell>
  );
}
