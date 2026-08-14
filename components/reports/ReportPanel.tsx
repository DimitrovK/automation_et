'use client';

import type { ReactNode } from 'react';
import type { UseReport } from '@/hooks/use-report';
import { ReportError } from '@/components/reports/ReportError';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * One panel that owns its own loading, error and content.
 *
 * The reports handled all three at PAGE level, so a page making four requests
 * showed nothing until the slowest returned, and one failing endpoint replaced
 * every panel — including the three that had loaded fine. A failure in the
 * anomalies endpoint should not take the activity chart with it.
 *
 * The retry is inside the panel for the same reason: retrying should refetch
 * the thing that failed, not the whole page.
 *
 * `children` is a function so `data` is non-null inside it, which removes the
 * `!data` guard every call site used to repeat and the "loaded but empty"
 * branch that guard quietly created.
 */
export function ReportPanel<T>({ state, skeletonClassName = 'h-64 w-full', children }: {
  state: UseReport<T>;
  /** Sized per panel so the page doesn't reflow as each one lands. */
  skeletonClassName?: string;
  children: (data: T) => ReactNode;
}) {
  if (state.error) {
    return (
      <ReportError
        error={state.error}
        notDeployed={state.notDeployed}
        onRetry={state.refetch}
      />
    );
  }

  // Skeleton only before there is anything to show. On a refetch — changing the
  // range, toggling bots — the previous numbers stay on screen: they are one
  // filter out of date for a moment, which beats every panel flashing to grey
  // and the page jumping as each one lands again.
  if (!state.data) {
    return <Skeleton className={skeletonClassName} />;
  }

  return (
    <div className={state.isLoading ? 'opacity-60 transition-opacity' : undefined}>
      {children(state.data)}
    </div>
  );
}
