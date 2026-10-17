import { INSIGHTS_NAV_GROUPS, INSIGHTS_NAV_TRAILING } from '@/components/insights/InsightsNav';

export type NavigationPage = {
  label: string;
  href?: string;
  icon: any;
  description: string;
  children?: NavigationPage[];
  defaultExpanded?: boolean;
};

/**
 * The Insights children of the global nav, built FROM the section nav rather
 * than kept as a second copy of it. The second copy had drifted twice (retired
 * routes offered, new pages missing), and every drift was a click into a
 * redirect that nothing caught.
 */
export const INSIGHTS_CHILDREN: NavigationPage[] = [
  ...INSIGHTS_NAV_GROUPS.flatMap(group => group.items.map(item => ({
    label: item.label,
    href: item.href,
    icon: item.icon,
    description: group.heading ?? '',
  }))),
  { ...INSIGHTS_NAV_TRAILING, description: 'How each figure is calculated, and how it gets misread' },
];
