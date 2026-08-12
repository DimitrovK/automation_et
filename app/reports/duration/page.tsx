'use client';

import type { RangeState } from '@/lib/report-range';
import { useMemo, useState } from 'react';
import { DurationTable } from '@/components/reports/DurationTable';
import { RangePicker } from '@/components/reports/RangePicker';
import { ReportError } from '@/components/reports/ReportError';
import { ReportsShell } from '@/components/reports/ReportsShell';
import { Skeleton } from '@/components/ui/skeleton';
import { useGameMeta } from '@/hooks/use-game-meta';
import { useReport } from '@/hooks/use-report';
import { useAuth } from '@/lib/auth';
import { rangeToParams } from '@/lib/report-range';
import { ReportsAPI } from '@/lib/reports-api';

export default function DurationPage() {
  const { isAuthenticated, user } = useAuth();
  const enabled = isAuthenticated && !!(user?.is_staff || user?.is_superuser);

  const [range, setRange] = useState<RangeState>({ window: 30 });
  const [includeBots, setIncludeBots] = useState(false);
  const params = useMemo(
    () => ({ ...rangeToParams(range), include_bots: includeBots }),
    [range, includeBots],
  );

  const { meta } = useGameMeta(enabled);
  const { data, isLoading, error, notDeployed, refetch } = useReport(
    ReportsAPI.getDuration,
    params,
    enabled,
    'The duration reporting endpoint',
  );

  return (
    <ReportsShell
      title="Session length"
      description="How long people stay in a game — the closest proxy we have for what holds attention."
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
          ? <Skeleton className="h-80 w-full" />
          : <DurationTable data={data} meta={meta} />}
    </ReportsShell>
  );
}
