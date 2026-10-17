'use client';

import type { NavGroup, NavItem } from '@/components/admin/SectionNav';
import {
  BarChart3,
  BookOpen,
  Flag,
  Gamepad2,
  Grid3x3,
  HelpCircle,
  LayoutGrid,
  Repeat,
  Route,
  Shield,
  User,
  Users,
  Users2,
} from 'lucide-react';

/**
 * One nav for everything that answers "how is the platform doing".
 *
 * Reports and Analytics used to be two sections with two navs, and each had a
 * group called "Per game" holding different pages: a game's numbers lived in
 * up to three places and the reader had to know which section asked which
 * question. Now there is one section, grouped by what the reader is looking
 * for: the platform, a game, people, the football data behind the games.
 *
 * The routes did not move (bookmarks keep working); only the grouping did.
 */
export const INSIGHTS_NAV_GROUPS: NavGroup[] = [
  {
    heading: 'Overview',
    items: [
      { href: '/reports', label: 'Daily Pulse', icon: BarChart3 },
    ],
  },
  {
    heading: 'Games',
    items: [
      { href: '/reports/games', label: 'All games', icon: LayoutGrid },
      { href: '/games/grid', label: 'Grid', icon: Grid3x3 },
      { href: '/analytics/career-path', label: 'Career Path', icon: Route },
      { href: '/analytics/lineups', label: 'Missing 11', icon: Users2 },
      { href: '/reports/multiplayer', label: 'Multiplayer', icon: Gamepad2 },
    ],
  },
  {
    heading: 'People',
    items: [
      { href: '/reports/players', label: 'Players', icon: Users },
      { href: '/reports/retention', label: 'Retention', icon: Repeat },
    ],
  },
  {
    // Every game reads this data, so a gap here belongs to none of them in
    // particular, and the fix is "add data" rather than "rewrite content".
    heading: 'Football data',
    items: [
      { href: '/analytics/football-data/footballers', label: 'Footballers', icon: User },
      { href: '/analytics/football-data/nations', label: 'Nations', icon: Flag },
      { href: '/analytics/football-data/teams', label: 'Teams', icon: Shield },
      { href: '/analytics/football-data/questions', label: 'Questions', icon: HelpCircle },
    ],
  },
];

export const INSIGHTS_NAV_TRAILING: NavItem = {
  href: '/reports/glossary',
  label: 'What the numbers mean',
  icon: BookOpen,
};

/** A shortlist for the dashboard card, not the nav: every one must be a nav destination. */
export const INSIGHTS_QUICK_LINKS: NavItem[] = [
  { href: '/reports', label: 'Daily Pulse', icon: BarChart3 },
  { href: '/reports/games', label: 'All games', icon: LayoutGrid },
  { href: '/games/grid', label: 'Grid', icon: Grid3x3 },
  { href: '/analytics/football-data/footballers', label: 'Football data', icon: User },
];
