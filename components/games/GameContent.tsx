'use client';

import type { ReactNode } from 'react';
import type { ReportParams } from '@/types/reports';
import { CategoryQuality } from '@/components/analytics/panels/CategoryQuality';
import { DifficultyTiers } from '@/components/analytics/panels/DifficultyTiers';
import { FootballerContent } from '@/components/analytics/panels/FootballerContent';
import { GlobalQuizUsage } from '@/components/analytics/panels/GlobalQuizUsage';
import { LineupSlots } from '@/components/analytics/panels/LineupSlots';
import { LineupWorkload } from '@/components/analytics/panels/LineupWorkload';
import { ModeRates } from '@/components/analytics/panels/ModeRates';
import { ModeVolume } from '@/components/analytics/panels/ModeVolume';
import { QuestionQuality } from '@/components/analytics/panels/QuestionQuality';
import { FormatFallbacks } from '@/components/reports/panels/ContentHealth';
import { ReportPanel } from '@/components/reports/primitives/ReportPanel';
import { useCareerPathTable } from '@/hooks/use-career-path-table';
import { useReport } from '@/hooks/use-report';
import { ReportsAPI } from '@/lib/reports-api';

type ContentProps = { params: ReportParams; enabled: boolean };

function CareerPathContent({ params, enabled }: ContentProps) {
  const table = useCareerPathTable();
  const state = useReport(
    reportParams => ReportsAPI.getCareerPathAnalytics(reportParams, {
      search: table.search || undefined,
      page: table.page,
      pageSize: table.pageSize,
      ordering: table.ordering,
    }),
    params,
    enabled,
    'The Career Path analytics endpoint',
    // The table's own state is not in `params`; without this key the search
    // box and the column headers would never refetch.
    table.requestKey,
  );
  return (
    <>
      {/* Side by side: the same rows asked two opposite questions, how much of a
          mode there is and how it plays. Read apart the rate points at the mode
          almost nobody is in. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ReportPanel state={state} skeletonClassName="h-104 w-full">
          {data => <ModeVolume data={data} />}
        </ReportPanel>
        <ReportPanel state={state} skeletonClassName="h-104 w-full">
          {data => <ModeRates data={data} />}
        </ReportPanel>
      </div>
      <ReportPanel state={state} skeletonClassName="h-96 w-full">
        {data => (
          <FootballerContent
            data={data}
            search={table.search}
            onSearchChange={table.setSearch}
            ordering={table.ordering}
            onSort={table.sortBy}
            onPageChange={table.setPage}
            onPageSizeChange={table.setPageSize}
            busy={state.isLoading}
          />
        )}
      </ReportPanel>
      <ReportPanel state={state} skeletonClassName="h-64 w-full">
        {data => <DifficultyTiers data={data} />}
      </ReportPanel>
    </>
  );
}

function LineupsContent({ params, enabled }: ContentProps) {
  const state = useReport(ReportsAPI.getLineupsAnalytics, params, enabled, 'The lineups analytics endpoint');
  return (
    <>
      <ReportPanel state={state} skeletonClassName="h-96 w-full">
        {data => <LineupSlots data={data} />}
      </ReportPanel>
      <ReportPanel state={state} skeletonClassName="h-80 w-full">
        {data => <LineupWorkload data={data} />}
      </ReportPanel>
    </>
  );
}

function QuizContent({ params, enabled }: ContentProps) {
  const state = useReport(ReportsAPI.getQuestionsAnalytics, params, enabled, 'The questions analytics endpoint');
  return (
    <>
      <ReportPanel state={state} skeletonClassName="h-96 w-full">
        {data => <QuestionQuality data={data} />}
      </ReportPanel>
      <ReportPanel state={state} skeletonClassName="h-80 w-full">
        {data => <CategoryQuality data={data} />}
      </ReportPanel>
      <ReportPanel state={state} skeletonClassName="h-64 w-full">
        {data => <GlobalQuizUsage data={data} />}
      </ReportPanel>
    </>
  );
}

function ConquestContent({ params, enabled }: ContentProps) {
  const state = useReport(ReportsAPI.getFallbacks, params, enabled, 'The answer-format fallback endpoint');
  return (
    <ReportPanel state={state} skeletonClassName="h-56 w-full">
      {data => <FormatFallbacks data={data} />}
    </ReportPanel>
  );
}

export type GameContentEntry = {
  /** The fold's title on the game page. */
  title: string;
  /** One line under it while folded. */
  summary: string;
  render: (props: ContentProps) => ReactNode;
};

/**
 * A game's own content cards, by registry key: the one place that says which
 * game has which deep-dive. A game with no entry shows only the shared rows
 * (difficulty, attempts, drop-off, stock), which every game has.
 *
 * Declarative on purpose: the per-game pages used to be separate routes with
 * their own shells and tabs, and a new game's content page meant a new route,
 * a nav entry and a tab mapping. Now it is one entry here.
 */
export const GAME_CONTENT: Record<string, GameContentEntry> = {
  career_path: {
    title: 'Footballers and modes',
    summary: 'Which footballers make everyone take a hint, and how each mode plays',
    render: props => <CareerPathContent {...props} />,
  },
  missing11: {
    title: 'Lineups',
    summary: 'Which slots cost the most guesses, and which lineups ask the most',
    render: props => <LineupsContent {...props} />,
  },
  quiz: {
    title: 'Questions',
    summary: 'Broken questions, weak categories, and which quizzes ran',
    render: props => <QuizContent {...props} />,
  },
  conquest: {
    title: 'Answer formats',
    summary: 'Where a challenge could not fill its multiple choice',
    render: props => <ConquestContent {...props} />,
  },
};
