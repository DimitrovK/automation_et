'use client';

import type { ReactNode } from 'react';
import { SectionShell } from '@/components/admin/SectionShell';
import { REPORT_NAV_GROUPS, REPORT_NAV_TRAILING } from '@/components/reports/ReportsNav';

/**
 * Reports chrome. Everything shared with User Hub now lives in SectionShell;
 * this only supplies what is specific to Reports — its nav groups, and the
 * staff (not superuser) gate that mirrors IsAdminUser on every
 * /core/reporting/* endpoint.
 */
export function ReportsShell({ title, description, actions, children }: {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <SectionShell
      title={title}
      description={description}
      groups={REPORT_NAV_GROUPS}
      trailing={REPORT_NAV_TRAILING}
      actions={actions}
    >
      {children}
    </SectionShell>
  );
}
