'use client';

import { useState } from 'react';
import { NationDepth } from '@/components/analytics/panels/NationDepth';
import { NationGaps } from '@/components/analytics/panels/NationGaps';
import { AnalyticsShell } from '@/components/analytics/shell/AnalyticsShell';
import { ReportPanel } from '@/components/reports/primitives/ReportPanel';
import { useNationTable } from '@/hooks/use-nation-table';
import { useReport } from '@/hooks/use-report';
import { useAuth } from '@/lib/auth';
import { ReportsAPI } from '@/lib/reports-api';

/** Rows a gap list shows before you ask for more, and after. */
const WORKLIST = 10;
const EXPANDED = 100;

/**
 * Nation coverage.
 *
 * No date filter, on purpose: this describes the catalogue as it stands rather
 * than what changed in a window, and offering a range picker would imply the
 * number moves with it.
 */
export default function NationsAnalyticsPage() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);
  const table = useNationTable();
  // Separate from the table's page size. One number used to drive all three
  // lists, so the row-count dropdown rewrote both worklists underneath it.
  const [worklistLimit, setWorklistLimit] = useState(WORKLIST);

  const state = useReport(
    () => ReportsAPI.getNationGaps(
      worklistLimit,
      table.pageSize,
      table.page,
      table.ordering,
      table.search || undefined,
    ),
    {},
    enabled,
    'The nation gaps endpoint',
    // Every value the request is built from — without it, nothing refetches.
    `${table.requestKey}:${worklistLimit}`,
  );

  return (
    <AnalyticsShell
      title="Nations"
      description="Where the catalogue is deepest, and which nations nothing points at."
    >
      {/* The table first. It is what the page is for — the two worklists below
          are the follow-up, and at the top they pushed the ranking under the
          fold on every laptop. */}
      <ReportPanel state={state} skeletonClassName="h-96 w-full">
        {data => (
          <NationDepth
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
          <NationGaps
            data={data}
            expanded={worklistLimit >= EXPANDED}
            onExpand={() => setWorklistLimit(EXPANDED)}
          />
        )}
      </ReportPanel>
    </AnalyticsShell>
  );
}
