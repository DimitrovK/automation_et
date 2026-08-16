'use client';

import { useState } from 'react';
import { ReviewQueue } from '@/components/analytics/panels/ReviewQueue';
import { TeamGaps } from '@/components/analytics/panels/TeamGaps';
import { AnalyticsShell } from '@/components/analytics/shell/AnalyticsShell';
import { ReportPanel } from '@/components/reports/primitives/ReportPanel';
import { useReport } from '@/hooks/use-report';
import { useAuth } from '@/lib/auth';
import { ReportsAPI } from '@/lib/reports-api';

const PAGE = 10;
const EXPANDED = 100;

/** Team coverage. No date filter — see the nations page for why. */
export default function TeamsAnalyticsPage() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);
  const [limit, setLimit] = useState(PAGE);

  const state = useReport(
    () => ReportsAPI.getTeamGaps(limit),
    {},
    enabled,
    'The team gaps endpoint',
    String(limit),
  );

  return (
    <AnalyticsShell
      title="Teams"
      description="Teams nobody plays for, and anything still waiting on review."
    >
      <ReportPanel state={state} skeletonClassName="h-80 w-full">
        {data => (
          <div className="space-y-4">
            <TeamGaps data={data} expanded={limit > PAGE} onExpand={() => setLimit(EXPANDED)} />
            <ReviewQueue counts={data.review_queue} subject="teams" />
          </div>
        )}
      </ReportPanel>
    </AnalyticsShell>
  );
}
