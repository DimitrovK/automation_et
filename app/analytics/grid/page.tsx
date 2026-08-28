'use client';

import type { RangeState } from '@/lib/report-range';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { GridAssists } from '@/components/analytics/panels/GridAssists';
import { GridCriteria, GridCriterionTypes, GridTeams } from '@/components/analytics/panels/GridContent';
import { GridModes } from '@/components/analytics/panels/GridModes';
import { GridPool } from '@/components/analytics/panels/GridPool';
import { GridPopularity } from '@/components/analytics/panels/GridPopularity';
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
 * Grid content quality — modes first, then the two worklists.
 *
 * Grid's puzzles are generated, so there is no "broken puzzle" to find; what
 * an admin tunes is what generation draws from. The page leads with the mode
 * and variation health (is a newly composed mode playable at all), then the
 * criterion worklist (which criteria mislead — the single most actionable
 * signal here), then the footballer pool (data bugs and dead weight).
 *
 * Player BEHAVIOUR for Grid — volume, retention, session length — stays in
 * /reports/games/grid, which this page links to and which links back: one
 * question per surface, one home for each.
 */
export default function GridAnalyticsPage() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);

  // 90 days like the other content pages: criteria need 25 sessions before a
  // rate is stated, and the long tail of criterion identities is exactly what
  // this page exists to reach.
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
    ReportsAPI.getGridAnalytics,
    params,
    enabled,
    'The Grid analytics endpoint',
  );

  return (
    <AnalyticsShell
      title="Grid content"
      description="Which criteria mislead, which pool footballers are broken or dead weight, and whether each mode and variation actually plays."
    >
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/reports/games/grid"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          Player behaviour for Grid lives in Reports
          <ArrowRight className="size-4" />
        </Link>
      </div>

      <FilterBar>
        <RangePicker
          value={range}
          onChange={setRange}
          includeBots={includeBots}
          onIncludeBotsChange={setIncludeBots}
        />
      </FilterBar>

      {/* Four sections so OnThisPage reads the WHOLE page: with only two
          headings the jump list hid the top half and filed the assists
          panel under "worklists", which it is not. */}
      <SectionHeader
        title="What people pick"
        description="Popularity first — every other number on this page assumes you know which modes are big."
      />

      <ReportPanel state={state} skeletonClassName="h-72 w-full">
        {data => <GridPopularity data={data} />}
      </ReportPanel>

      <ReportPanel state={state} skeletonClassName="h-96 w-full">
        {data => <GridModes data={data} />}
      </ReportPanel>

      <SectionHeader
        title="The content worklists"
        description="Ordered worst first — these tables exist to be worked through, not browsed."
      />

      <ReportPanel state={state} skeletonClassName="h-96 w-full">
        {data => <GridCriteria data={data} />}
      </ReportPanel>

      <ReportPanel state={state} skeletonClassName="h-80 w-full">
        {data => <GridPool data={data} />}
      </ReportPanel>

      <SectionHeader
        title="Where the help goes"
        description="Extra Times and skips — what players pay to get past."
      />

      <ReportPanel state={state} skeletonClassName="h-96 w-full">
        {data => <GridAssists data={data} />}
      </ReportPanel>

      <SectionHeader
        title="Reach"
        description="What players actually see most — types and clubs by volume."
      />

      <ReportPanel state={state} skeletonClassName="h-80 w-full">
        {data => <GridCriterionTypes data={data} />}
      </ReportPanel>

      <ReportPanel state={state} skeletonClassName="h-80 w-full">
        {data => <GridTeams data={data} />}
      </ReportPanel>
    </AnalyticsShell>
  );
}
