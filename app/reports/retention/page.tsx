'use client';

import type { RangeState } from '@/lib/report-range';
import type { RetentionCohort } from '@/types/reports';
import { useMemo, useState } from 'react';
import { ExportButton } from '@/components/reports/ExportButton';
import { GameFilter } from '@/components/reports/GameFilter';
import { RangePicker } from '@/components/reports/RangePicker';
import { ReportError } from '@/components/reports/ReportError';
import { ReportsShell } from '@/components/reports/ReportsShell';
import { RetentionTable } from '@/components/reports/RetentionTable';
import { Skeleton } from '@/components/ui/skeleton';
import { useGameMeta } from '@/hooks/use-game-meta';
import { useReport } from '@/hooks/use-report';
import { useReportFilters } from '@/hooks/use-report-filters';
import { useAuth } from '@/lib/auth';
import { rangeToParams } from '@/lib/report-range';
import { ReportsAPI } from '@/lib/reports-api';

export default function RetentionPage() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);

  // 60 days by default: D30 needs a month of runway before any cohort can even
  // reach it, so a 7-day default would show a table of dashes.
  // Filters live in the URL so a view can be bookmarked, shared or reloaded
  // without losing what was selected.
  const { filters, update } = useReportFilters({
    range: { window: 60 },
    includeBots: false,
    game: null,
    metric: 'games_started',
  });
  const { range, includeBots, game } = filters;
  const setRange = (next: RangeState) => update({ range: next });
  const setIncludeBots = (next: boolean) => update({ includeBots: next });
  const setGame = (next: string | null) => update({ game: next });
  const params = useMemo(
    () => ({ ...rangeToParams(range), include_bots: includeBots, ...(game ? { game_type: game } : {}) }),
    [range, includeBots, game],
  );

  const { meta } = useGameMeta(enabled);
  const { data, isLoading, error, notDeployed, refetch } = useReport(
    ReportsAPI.getRetention,
    params,
    enabled,
    'The retention reporting endpoint',
  );

  return (
    <ReportsShell
      title="Retention"
      description="Do players come back? Volume can look healthy right up until the supply of new players runs out."
    >
      <RangePicker
        value={range}
        onChange={setRange}
        includeBots={includeBots}
        onIncludeBotsChange={setIncludeBots}
      />

      <GameFilter meta={meta} value={game} onChange={setGame} />

      <div className="flex justify-end">
        <ExportButton
          rows={data?.cohorts ?? []}
          view="retention"
          filters={{ ...rangeToParams(range), bots: includeBots, game }}
          columns={[
                    { header: 'Cohort date', value: row => row.date },
                    { header: 'Cohort size', value: row => row.cohort_size },
                    { header: 'Inflated', value: row => row.inflated },
                    // One column per offset, because a JSON blob in a cell is
                    // not something a spreadsheet can chart. Null stays empty
                    // rather than 0: the cohort hasn't reached that day yet.
                    ...(data?.offsets ?? []).map(offset => ({
                      header: `D${offset} %`,
                      value: (row: RetentionCohort) => row.retention[String(offset)]?.pct ?? '',
                    })),
                    ...(data?.offsets ?? []).map(offset => ({
                      header: `D${offset} returned`,
                      value: (row: RetentionCohort) => row.retention[String(offset)]?.returned ?? '',
                    })),
                  ]}
        />
      </div>

      {error
        ? <ReportError error={error} notDeployed={notDeployed} onRetry={refetch} />
        : isLoading || !data
          ? <Skeleton className="h-96 w-full" />
          : <RetentionTable data={data} />}
    </ReportsShell>
  );
}
