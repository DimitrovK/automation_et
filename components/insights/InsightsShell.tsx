'use client';

import type { ReactNode } from 'react';
import { SectionShell } from '@/components/admin/SectionShell';
import { INSIGHTS_NAV_GROUPS, INSIGHTS_NAV_TRAILING } from '@/components/insights/InsightsNav';

/**
 * The chrome of every Insights page: the staff gate, the title and the one nav.
 * Every /core/reporting/* and /core/analytics/* endpoint is `IsAdminUser`, so
 * one gate serves both.
 */
export function InsightsShell({ title, description, actions, children }: {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <SectionShell
      title={title}
      description={description}
      groups={INSIGHTS_NAV_GROUPS}
      trailing={INSIGHTS_NAV_TRAILING}
      actions={actions}
    >
      {children}
    </SectionShell>
  );
}
