'use client';

import type { RangeState } from '@/lib/report-range';
import type { RetentionCohort } from '@/types/reports';
import { useMemo } from 'react';
import { FilterBar } from '@/components/reports/filters/FilterBar';
import { GameFilter } from '@/components/reports/filters/GameFilter';
import { RangePicker } from '@/components/reports/filters/RangePicker';
import { FirstSessionFollowup } from '@/components/reports/panels/FirstSessionFollowup';
import { RetentionByGame } from '@/components/reports/panels/RetentionByGame';
import { RetentionTable } from '@/components/reports/panels/RetentionTable';
import { ExportButton } from '@/components/reports/primitives/ExportButton';
import { ReportPanel } from '@/components/reports/primitives/ReportPanel';
import { SectionHeader } from '@/components/reports/primitives/SectionHeader';
import { ReportsShell } from '@/components/reports/shell/ReportsShell';
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
  const state = useReport(
    ReportsAPI.getRetention,
    params,
    enabled,
    'The retention reporting endpoint',
  );
  const firstSession = useReport(
    ReportsAPI.getFirstSession,
    params,
    enabled,
    'The first-session reporting endpoint',
  );

  return (
    <ReportsShell
      title="Retention"
      description="Do players come back? Volume can look healthy right up until the supply of new players runs out."
    >
      <FilterBar>
        <RangePicker
          value={range}
          onChange={setRange}
          includeBots={includeBots}
          onIncludeBotsChange={setIncludeBots}
        />

        <GameFilter meta={meta} value={game} onChange={setGame} />

      </FilterBar>
      <div className="flex justify-end">
        <ExportButton
          rows={state.data?.cohorts ?? []}
          view="retention"
          filters={{ ...rangeToParams(range), bots: includeBots, game }}
          columns={[
            { header: 'Cohort date', value: row => row.date },
            { header: 'Cohort size', value: row => row.cohort_size },
            { header: 'Inflated', value: row => row.inflated },
            // One column per offset, because a JSON blob in a cell is
            // not something a spreadsheet can chart. Null stays empty
            // rather than 0: the cohort hasn't reached that day yet.
            ...(state.data?.offsets ?? []).map(offset => ({
              header: `D${offset} %`,
              value: (row: RetentionCohort) => row.retention[String(offset)]?.pct ?? '',
            })),
            ...(state.data?.offsets ?? []).map(offset => ({
              header: `D${offset} returned`,
              value: (row: RetentionCohort) => row.retention[String(offset)]?.returned ?? '',
            })),
          ]}
        />
      </div>

      <ReportPanel state={state} skeletonClassName="h-96 w-full">
        {data => (
          <>
            {/* Before the cohort grid: "which games keep people" is the
                question someone arrives with, and the grid answers "which
                days did". */}
            <RetentionByGame data={data} meta={meta} />
            <RetentionTable data={data} />
          </>
        )}
      </ReportPanel>

      {/* Beside retention rather than on its own page: the two are easy to
          confuse, and reading either alone gets the conclusion backwards. A game
          can hold nobody itself and still be the best front door on the
          platform. Its own panel, so one request cannot blank the other. */}
      <SectionHeader
        title="Where new players start"
        description="Retention above asks whether a game keeps its own players. This asks which game keeps people on the platform at all."
      />

      <ReportPanel state={firstSession} skeletonClassName="h-72 w-full">
        {data => <FirstSessionFollowup data={data} meta={meta} />}
      </ReportPanel>
    </ReportsShell>
  );
}
