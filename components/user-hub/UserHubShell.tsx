'use client';

import type { NavGroup, NavItem } from '@/components/admin/SectionNav';
import type { ReactNode } from 'react';
import { LayoutDashboard, Star, Users } from 'lucide-react';
import { SectionShell } from '@/components/admin/SectionShell';

/**
 * The User Hub's sections. One group, so no heading: headings earn their place
 * by telling groups apart, and Reports needs them for ten destinations where
 * this needs none for two.
 */
export const USER_HUB_NAV_GROUPS: NavGroup[] = [
  {
    heading: '',
    items: [
      { href: '/user-hub', label: 'Overview', icon: LayoutDashboard },
      { href: '/user-hub/users', label: 'Users', icon: Users },
    ],
  },
];

/**
 * Where favourites analytics went. Kept as a visible pointer rather than
 * dropped: it lived here for months, and a section that silently loses a tab
 * teaches people the page is gone.
 */
export const USER_HUB_NAV_TRAILING: NavItem = {
  href: '/reports/favourites',
  label: 'Favourites moved to Reports',
  icon: Star,
};

/**
 * User Hub chrome. Everything shared with Reports lives in SectionShell; this
 * supplies only what is specific — its nav, and the superuser gate.
 *
 * The gate is the one real difference between the two sections. Reports gates
 * on is_staff, matching the BE where every /core/reporting/* endpoint is
 * IsAdminUser; User Hub gates on superuser because it exposes per-user data
 * rather than platform aggregates.
 */
export function UserHubShell({ title, description, actions, children }: {
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <SectionShell
      title={title}
      description={description}
      groups={USER_HUB_NAV_GROUPS}
      trailing={USER_HUB_NAV_TRAILING}
      requireSuperuser
      actions={actions}
    >
      {children}
    </SectionShell>
  );
}
