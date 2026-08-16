import {
  BarChart3,
  BookOpen,
  Database,
  Flag,
  Gamepad2,
  HelpCircle,
  LayoutGrid,
  Repeat,
  Route,
  Shield,
  TriangleAlert,
  User,
  Users,
  Users2,
} from 'lucide-react';

export type NavigationPage = {
  label: string;
  href?: string;
  icon: any;
  description: string;
  children?: NavigationPage[];
  defaultExpanded?: boolean;
};

/**
 * The Reports and Analytics children, at module scope so a guard can read the
 * SAME array the nav renders rather than a second copy of it.
 *
 * This nav had drifted from the section navs: it still offered Patterns,
 * Session length and Favourites — three routes retired in #1474 R4 — while
 * omitting Needs attention, Games and the glossary. Every one of those was a
 * click into a redirect, and nothing failed.
 */
export const REPORTS_CHILDREN: NavigationPage[] = [
  { label: 'Daily Pulse', href: '/reports', icon: BarChart3, description: 'How today compares with a typical day' },
  { label: 'Needs attention', href: '/reports/anomalies', icon: TriangleAlert, description: 'What moved more than noise explains' },
  { label: 'Games', href: '/reports/games', icon: LayoutGrid, description: 'Per-game health, content and format' },
  { label: 'Multiplayer', href: '/reports/multiplayer', icon: Gamepad2, description: 'Room funnel: created, started, finished' },
  { label: 'Players', href: '/reports/players', icon: Users, description: 'Most active players over a window' },
  { label: 'Retention', href: '/reports/retention', icon: Repeat, description: 'Do players come back? D1/D7/D30 cohorts' },
  { label: 'What the numbers mean', href: '/reports/glossary', icon: BookOpen, description: 'How each figure is calculated, and how it gets misread' },
];

export const ANALYTICS_CHILDREN: NavigationPage[] = [
  { label: 'Football data', href: '/analytics/football-data', icon: Database, description: 'What the games are missing, and what is being added' },
  { label: 'Footballers', href: '/analytics/football-data/footballers', icon: User, description: 'How the catalogue is shaped, and who built it' },
  { label: 'Nations', href: '/analytics/football-data/nations', icon: Flag, description: 'Nations nothing points at' },
  { label: 'Teams', href: '/analytics/football-data/teams', icon: Shield, description: 'Teams nobody plays for' },
  { label: 'Career Path', href: '/analytics/career-path', icon: Route, description: 'Which footballers make everyone take a hint' },
  { label: 'Quiz content', href: '/analytics/questions', icon: HelpCircle, description: 'Which questions nobody gets right' },
  { label: 'Lineups', href: '/analytics/lineups', icon: Users2, description: 'Which slots cost the most guesses' },
];

/**
 * Every reports/analytics destination the global nav offers. Guarded against
 *  the section navs in `components/admin/__tests__/SectionNav.test.tsx`.
 */
export const GLOBAL_NAV_SECTION_HREFS: string[] = [
  ...REPORTS_CHILDREN.map(page => page.href!),
  ...ANALYTICS_CHILDREN.map(page => page.href!),
];
