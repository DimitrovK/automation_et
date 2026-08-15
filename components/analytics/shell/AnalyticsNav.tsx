'use client';

import type { NavGroup } from '@/components/admin/SectionNav';
import { Route } from 'lucide-react';

/**
 * Analytics, which is not Reports and should not be folded into it.
 *
 * Reports answer *how are players behaving* — volume, retention, abandonment,
 * session length. Analytics answer *is the material any good* — which
 * footballer makes everyone take a hint, which question nobody gets right.
 * Different question, different reader, different cadence: a report is read
 * weekly by whoever is deciding what to build, and this is read by whoever is
 * writing content, when they are writing it.
 *
 * One destination today, grouped rather than flat because four more are coming
 * (App#1475) and a heading that appears later reorganises the section under
 * someone who had learned where things were.
 */
export const ANALYTICS_NAV_GROUPS: NavGroup[] = [
  {
    heading: 'Per game',
    items: [
      { href: '/analytics/career-path', label: 'Career Path', icon: Route },
    ],
  },
];
