'use client';

import type { RangeState } from '@/lib/report-range';
import { useMemo, useState } from 'react';
import { RangePicker } from '@/components/reports/RangePicker';
import { ReportError } from '@/components/reports/ReportError';
import { ReportsShell } from '@/components/reports/ReportsShell';
import { RetentionTable } from '@/components/reports/RetentionTable';
import { Skeleton } from '@/components/ui/skeleton';
import { useReport } from '@/hooks/use-report';
import { useAuth } from '@/lib/auth';
import { rangeToParams } from '@/lib/report-range';
import { ReportsAPI } from '@/lib/reports-api';

export default function RetentionPage() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);

  // 60 days by default: D30 needs a month of runway before any cohort can even
  // reach it, so a 7-day default would show a table of dashes.
  const [range, setRange] = useState<RangeState>({ window: 60 });
  const [includeBots, setIncludeBots] = useState(false);
  const params = useMemo(
    () => ({ ...rangeToParams(range), include_bots: includeBots }),
    [range, includeBots],
  );

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

      {error
        ? <ReportError error={error} notDeployed={notDeployed} onRetry={refetch} />
        : isLoading || !data
          ? <Skeleton className="h-96 w-full" />
          : <RetentionTable data={data} />}
    </ReportsShell>
  );
}
