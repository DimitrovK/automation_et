'use client';

import type { Sensitivity } from '@/components/reports/AnomalySensitivity';
import { useMemo, useState } from 'react';
import { AnomalyPanel } from '@/components/reports/AnomalyPanel';
import { AnomalySensitivity, SENSITIVITY_PRESETS } from '@/components/reports/AnomalySensitivity';
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

/**
 * What moved enough to be worth attention.
 *
 * Moved off the Daily Pulse, which is about today: anomalies compare a window
 * against the one before it, so the two answered different questions while
 * sitting in the same column. Given its own page it also has room for the
 * sensitivity control and a range that belongs to it rather than to the pulse.
 */
export default function AnomaliesPage() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);

  const { filters, update } = useReportFilters({
    range: { window: 30 },
    includeBots: false,
    game: null,
    metric: 'games_started',
  });
  const { range, includeBots } = filters;
  const setRange = (next: typeof range) => update({ range: next });
  const setIncludeBots = (next: boolean) => update({ includeBots: next });

  // Deliberately not in the URL: sensitivity changes what counts as worth
  // reporting, not what the report covers, so a shared link carries the period
  // and not the reader's tolerance for noise.
  const [sensitivity, setSensitivity] = useState<Sensitivity>('default');

  const params = useMemo(
    () => ({
      ...rangeToParams(range),
      include_bots: includeBots,
      min_volume: SENSITIVITY_PRESETS[sensitivity].min_volume,
      min_change_pct: SENSITIVITY_PRESETS[sensitivity].min_change_pct,
    }),
    [range, includeBots, sensitivity],
  );

  const { meta } = useGameMeta(enabled);
  const anomalies = useReport(ReportsAPI.getAnomalies, params, enabled, 'The anomalies reporting endpoint');

  return (
    <ReportsShell
      title="Needs attention"
      description="What moved enough to be worth interrupting you for, compared with the window before it."
    >
      <FilterBar>
        <RangePicker
          value={range}
          onChange={setRange}
          includeBots={includeBots}
          onIncludeBotsChange={setIncludeBots}
        />

        {/* No game filter on purpose: the point of this page is to surface the
            game you would not have thought to look at. */}
        <AnomalySensitivity value={sensitivity} onChange={setSensitivity} />

      </FilterBar>
      <div className="flex justify-end">
        <ExportButton
          rows={anomalies.data?.findings ?? []}
          view="anomalies"
          filters={{ ...rangeToParams(range), bots: includeBots, sensitivity }}
          columns={[
            { header: 'Severity', value: row => row.severity },
            { header: 'Scope', value: row => row.scope },
            { header: 'Game', value: row => row.game_type ?? 'platform' },
            { header: 'Metric', value: row => row.metric },
            { header: 'Change %', value: row => row.change_pct },
            { header: 'Current', value: row => row.current },
            { header: 'Previous', value: row => row.previous },
            { header: 'Headline', value: row => row.headline },
            { header: 'Detail', value: row => row.detail },
          ]}
        />
      </div>

      <ReportPanel state={anomalies} skeletonClassName="h-40 w-full">
        {data => <AnomalyPanel data={data} meta={meta} />}
      </ReportPanel>
    </ReportsShell>
  );
}
