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

/** Rows the empty-team worklist shows before you ask for more, and after. */
const WORKLIST = 10;
const EXPANDED = 100;

/** Team coverage. No date filter — see the nations page for why. */
export default function TeamsAnalyticsPage() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);
  const table = useTeamTable();
  // Its own control now. The endpoint used to take one `limit` for the table
  // and the worklist, so the row-count dropdown quietly rewrote this list too.
  const [worklistLimit, setWorklistLimit] = useState(WORKLIST);

  const state = useReport(
    () => ReportsAPI.getTeamGaps(
      worklistLimit,
      table.search || undefined,
      table.page,
      table.ordering,
      table.pageSize,
    ),
    {},
    enabled,
    'The team gaps endpoint',
    // Every value the request is built from. Drop one and the control that
    // changes it stops refetching — see `use-ranked-table`.
    `${table.requestKey}:${worklistLimit}`,
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
            onPageSizeChange={table.setPageSize}
            busy={state.isLoading}
          />
        )}
      </ReportPanel>

      <ReportPanel state={state} skeletonClassName="h-80 w-full">
        {data => (
          <div className="space-y-4">
            <TeamGaps
              data={data}
              expanded={worklistLimit >= EXPANDED}
              onExpand={() => setWorklistLimit(EXPANDED)}
            />
            <ReviewQueue counts={data.review_queue} subject="teams" />
          </div>
        )}
      </ReportPanel>
    </AnalyticsShell>
  );
}
