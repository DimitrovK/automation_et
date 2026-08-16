'use client';

import { useState } from 'react';
import { NationGaps } from '@/components/analytics/panels/NationGaps';
import { AnalyticsShell } from '@/components/analytics/shell/AnalyticsShell';
import { ReportPanel } from '@/components/reports/primitives/ReportPanel';
import { useReport } from '@/hooks/use-report';
import { useAuth } from '@/lib/auth';
import { ReportsAPI } from '@/lib/reports-api';

/** Rows a gap list shows before you ask for more, and after. */
const PAGE = 10;
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
  const [limit, setLimit] = useState(PAGE);

  const state = useReport(
    () => ReportsAPI.getNationGaps(limit),
    {},
    enabled,
    'The nation gaps endpoint',
    // Part of the fetch identity: without it, asking for more would not refetch.
    String(limit),
  );

  return (
    <AnalyticsShell
      title="Nations"
      description="Which nations nothing points at, and where the catalogue is deepest."
    >
      <ReportPanel state={state} skeletonClassName="h-96 w-full">
        {data => (
          <NationGaps
            data={data}
            expanded={limit > PAGE}
            onExpand={() => setLimit(EXPANDED)}
          />
        )}
      </ReportPanel>
    </AnalyticsShell>
  );
}
