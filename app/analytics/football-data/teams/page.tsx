'use client';

import { useState } from 'react';
import { ReviewQueue } from '@/components/analytics/panels/ReviewQueue';
import { SquadDepth } from '@/components/analytics/panels/SquadDepth';
import { TeamGaps } from '@/components/analytics/panels/TeamGaps';
import { AnalyticsShell } from '@/components/analytics/shell/AnalyticsShell';
import { ReportPanel } from '@/components/reports/primitives/ReportPanel';
import { useReport } from '@/hooks/use-report';
import { useTeamTable } from '@/hooks/use-team-table';
import { useAuth } from '@/lib/auth';
import { ReportsAPI } from '@/lib/reports-api';

/** What the gap worklist expands to. The ranking pages instead. */
const EXPANDED = 100;

/** Team coverage. No date filter — see the nations page for why. */
export default function TeamsAnalyticsPage() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);
  const table = useTeamTable();
  // The endpoint takes ONE limit for both lists, so the ranking's page size is
  // also the gap list's cap. Expanding the worklist therefore sets the page
  // size — coupled at the API, and worth splitting there rather than papering
  // over it here.
  const [expanded, setExpanded] = useState(false);

  const state = useReport(
    () => ReportsAPI.getTeamGaps(
      table.limit,
      table.search || undefined,
      table.page,
      table.ordering,
    ),
    {},
    enabled,
    'The team gaps endpoint',
    // Every value the request is built from. Drop one and the control that
    // changes it stops refetching — see `use-team-table`.
    table.requestKey,
  );

  return (
    <AnalyticsShell
      title="Teams"
      description="Which teams the catalogue leans on, which it forgot, and what is waiting on review."
    >

      <ReportPanel state={state} skeletonClassName="h-96 w-full">
        {data => (
          <SquadDepth
            data={data}
            search={table.search}
            onSearchChange={table.setSearch}
            ordering={table.ordering}
            onSort={table.sortBy}
            onPageChange={table.setPage}
            onLimitChange={(next) => {
              setExpanded(next >= EXPANDED);
              table.setLimit(next);
            }}
            busy={state.isLoading}
          />
        )}
      </ReportPanel>

      <ReportPanel state={state} skeletonClassName="h-80 w-full">
        {data => (
          <div className="space-y-4">
            <TeamGaps
              data={data}
              expanded={expanded}
              onExpand={() => {
                setExpanded(true);
                table.setLimit(EXPANDED);
              }}
            />
            <ReviewQueue counts={data.review_queue} subject="teams" />
          </div>
        )}
      </ReportPanel>
    </AnalyticsShell>
  );
}
