'use client';

import type { RangeState } from '@/lib/report-range';
import { useMemo } from 'react';
import { LineupSlots } from '@/components/analytics/panels/LineupSlots';
import { LineupWorkload } from '@/components/analytics/panels/LineupWorkload';
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
 * Missing11 content quality — slots first, lineups second.
 *
 * A slot is what an editor changes: swap one unguessable footballer and the
 * lineup is fixed. So the slot table leads and the whole-lineup view sits
 * underneath, answering the question the first one raises — is this a bad slot
 * or a lineup that is hard all the way through?
 */
export default function LineupsAnalyticsPage() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);

  // 90 days: a slot needs 30 sessions before its effort figure means anything,
  // and this game's content rotates daily — a month leaves most slots short.
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
    ReportsAPI.getLineupsAnalytics,
    params,
    enabled,
    'The lineups analytics endpoint',
  );

  return (
    <AnalyticsShell
      title="Lineup content"
      description="Which slots cost the most guesses, and which lineups ask the most of a player."
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
        {data => <LineupSlots data={data} />}
      </ReportPanel>

      <SectionHeader
        title="The lineups themselves"
        description="A demanding lineup is only a problem when people stop finishing it."
      />

      <ReportPanel state={state} skeletonClassName="h-80 w-full">
        {data => <LineupWorkload data={data} />}
      </ReportPanel>
    </AnalyticsShell>
  );
}
