'use client';

import type { NavGroup, NavItem } from '@/components/admin/SectionNav';
import { BarChart3, BookOpen, Clock, Gamepad2, Hourglass, LayoutGrid, Repeat, Star, Timer, TriangleAlert, Users } from 'lucide-react';

/**
 * Reports, grouped by the question each page answers.
 *
 * Eleven flat destinations read as a wall of equally-weighted choices — you have
 * to already know the names to find anything. These three headings are the
 * actual shape of the section: how is the platform doing, how is each game
 * doing, how are the people doing.
 */
export const REPORT_NAV_GROUPS: NavGroup[] = [
  {
    heading: 'Overview',
    items: [
      { href: '/reports', label: 'Daily Pulse', icon: BarChart3 },
      { href: '/reports/anomalies', label: 'Needs attention', icon: TriangleAlert },
      { href: '/reports/patterns', label: 'Patterns', icon: Clock },
      { href: '/reports/unfinished', label: 'Sitting unfinished', icon: Hourglass },
    ],
  },
  {
    heading: 'Per game',
    items: [
      { href: '/reports/games', label: 'Games', icon: LayoutGrid },
      { href: '/reports/multiplayer', label: 'Multiplayer', icon: Gamepad2 },
      { href: '/reports/duration', label: 'Session length', icon: Timer },
      { href: '/reports/favourites', label: 'Favourites', icon: Star },
    ],
  },
  {
    heading: 'People',
    items: [
      { href: '/reports/players', label: 'Players', icon: Users },
      { href: '/reports/retention', label: 'Retention', icon: Repeat },
    ],
  },
];

/** Reference, not a report — present without competing with the sections. */
export const REPORT_NAV_TRAILING: NavItem = {
  href: '/reports/glossary',
  label: 'What the numbers mean',
  icon: BookOpen,
};

/**
 * The handful of reports worth offering from the dashboard.
 *
 * Deliberately a shortlist, not the nav: a card that reprints ten destinations
 * is the nav with worse typography, and the dashboard's job is to get someone
 * moving, not to enumerate. These four are the questions asked on arrival —
 * how is today, what needs looking at, how are the games, who is playing.
 *
 * Every entry must be a real nav destination — enforced in
 * `components/admin/__tests__/SectionNav.test.tsx`, which owns the guards for
 * both sections' navs — so a shortcut cannot outlive the page it points at.
 */
export const REPORT_QUICK_LINKS: NavItem[] = [
  { href: '/reports', label: 'Daily Pulse', icon: BarChart3 },
  { href: '/reports/anomalies', label: 'Needs attention', icon: TriangleAlert },
  { href: '/reports/games', label: 'Games', icon: LayoutGrid },
  { href: '/reports/players', label: 'Players', icon: Users },
];
