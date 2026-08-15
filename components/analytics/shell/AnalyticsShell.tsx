'use client';

import type { ReactNode } from 'react';
import { SectionShell } from '@/components/admin/SectionShell';
import { ANALYTICS_NAV_GROUPS } from '@/components/analytics/shell/AnalyticsNav';

/**
 * Analytics chrome — the same shell Reports uses, with its own nav.
 *
 * Shares the staff gate for the same reason it shares the shell: every
 * /core/analytics/* endpoint is `IsAdminUser`, exactly as the reporting ones
 * are, and a second gate that could drift from it is worse than one.
 */
export function AnalyticsShell({ title, description, actions, children }: {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <SectionShell
      title={title}
      description={description}
      groups={ANALYTICS_NAV_GROUPS}
      actions={actions}
    >
      {children}
    </SectionShell>
  );
}
