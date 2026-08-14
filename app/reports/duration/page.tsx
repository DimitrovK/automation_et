'use client';

import type { RangeState } from '@/lib/report-range';
import { useMemo } from 'react';
import { DurationHistogram } from '@/components/reports/DurationHistogram';
import { DurationTable } from '@/components/reports/DurationTable';
import { ExportButton } from '@/components/reports/ExportButton';
import { FilterBar } from '@/components/reports/FilterBar';
import { RangePicker } from '@/components/reports/RangePicker';
import { ReportPanel } from '@/components/reports/ReportPanel';
import { ReportsShell } from '@/components/reports/ReportsShell';
import { useGameMeta } from '@/hooks/use-game-meta';
import { useReport } from '@/hooks/use-report';
import { useReportFilters } from '@/hooks/use-report-filters';
import { useAuth } from '@/lib/auth';
import { rangeToParams } from '@/lib/report-range';
import { ReportsAPI } from '@/lib/reports-api';

export default function DurationPage() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);

  // Filters live in the URL so a view can be bookmarked, shared or reloaded
  // without losing what was selected.
  const { filters, update } = useReportFilters({
    range: { window: 30 },
    includeBots: false,
    game: null,
    metric: 'games_started',
  });
  const { range, includeBots, game } = filters;
  const setRange = (next: RangeState) => update({ range: next });
  const setIncludeBots = (next: boolean) => update({ includeBots: next });
  const params = useMemo(
    () => ({ ...rangeToParams(range), include_bots: includeBots }),
    [range, includeBots],
  );

  const { meta } = useGameMeta(enabled);
  const state = useReport(
    ReportsAPI.getDuration,
    params,
    enabled,
    'The duration reporting endpoint',
  );

  return (
    <ReportsShell
      title="Session length"
      description="How long people stay in a game — the closest proxy we have for what holds attention."
    >
      <FilterBar>
        <RangePicker
          value={range}
          onChange={setRange}
          includeBots={includeBots}
          onIncludeBotsChange={setIncludeBots}
        />

      </FilterBar>
      <div className="flex justify-end">
        <ExportButton
          rows={state.data?.rows ?? []}
          view="duration"
          filters={{ ...rangeToParams(range), bots: includeBots, game }}
          columns={[
            { header: 'Game', value: row => row.game_type },
            { header: 'Supported', value: row => row.supported },
            { header: 'Sessions', value: row => row.sessions },
            { header: 'Measured', value: row => row.measured },
            { header: 'Coverage %', value: row => row.coverage_pct },
            { header: 'Median seconds', value: row => row.median_seconds },
            { header: 'Long sessions', value: row => row.long_sessions },
            { header: 'Single sitting', value: row => row.single_sitting },
          ]}
        />
      </div>

      <ReportPanel state={state} skeletonClassName="h-80 w-full">
        {data => (
          <>
            <DurationTable data={data} meta={meta} />
            {/* After the comparison, because "which game holds attention"
                comes before "what does this one look like". */}
            <DurationHistogram data={data} meta={meta} />
          </>
        )}
      </ReportPanel>
    </ReportsShell>
  );
}
