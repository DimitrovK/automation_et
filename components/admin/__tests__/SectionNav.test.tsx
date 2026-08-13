import { render, screen } from '@testing-library/react';
import { BarChart3, BookOpen, Users } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { SectionNav } from '@/components/admin/SectionNav';
import { REPORT_NAV_GROUPS, REPORT_NAV_TRAILING } from '@/components/reports/ReportsNav';

vi.mock('next/navigation', () => ({ usePathname: () => '/reports/players' }));

const GROUPS = [
  { heading: 'Overview', items: [{ href: '/reports', label: 'Daily Pulse', icon: BarChart3 }] },
  // Heading deliberately differs from the item name: a group called
  // "Players" containing a page called "Players" reads as a duplicate, and
  // the real nav was renamed to "People" for the same reason.
  { heading: 'People', items: [{ href: '/reports/players', label: 'Players', icon: Users }] },
];

describe('sectionNav', () => {
  it('shows the group headings, because they are the structure', () => {
    // Ten flat destinations read as a wall of equal choices. The headings say
    // what each group answers, so the nav teaches the section rather than
    // listing it.
    render(<SectionNav groups={GROUPS} />);

    expect(screen.getByText('Overview')).toBeTruthy();
    expect(screen.getByText('People')).toBeTruthy();
  });

  it('marks only the current page as current', () => {
    render(<SectionNav groups={GROUPS} />);

    expect(screen.getByRole('link', { name: /Players/ }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: /Daily Pulse/ }).getAttribute('aria-current')).toBeNull();
  });

  it('does not light up the section root on every page', () => {
    // "/reports" is a prefix of every reports URL, so a prefix match would mark
    // Daily Pulse current everywhere — the one bug this nav can plausibly have.
    render(<SectionNav groups={GROUPS} />);

    const current = screen.getAllByRole('link').filter(link => link.getAttribute('aria-current') === 'page');
    expect(current).toHaveLength(1);
  });

  it('keeps reference material out of the groups', () => {
    render(
      <SectionNav
        groups={GROUPS}
        trailing={{ href: '/reports/glossary', label: 'What the numbers mean', icon: BookOpen }}
      />,
    );

    expect(screen.getByRole('link', { name: /What the numbers mean/ })).toBeTruthy();
  });
});

describe('report nav groups', () => {
  it('has no group heading that duplicates a page name', () => {
    // A heading and an item with the same word makes the grouping look like a
    // typo rather than structure.
    const items = REPORT_NAV_GROUPS.flatMap(group => group.items.map(item => item.label));

    for (const group of REPORT_NAV_GROUPS) {
      expect(items, `group "${group.heading}" repeats a page name`).not.toContain(group.heading);
    }
  });

  it('covers every report page', async () => {
    // A page missing from the nav is unreachable except by URL — which is how
    // the player drill-down went unlinked until it was noticed by hand.
    const { readdirSync } = await import('node:fs');
    const { join } = await import('node:path');

    const root = join(process.cwd(), 'app', 'reports');
    const routes = new Set<string>(['/reports']);
    const walk = (dir: string, prefix: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        // Route groups and colocated tests are not pages.
        if (!entry.isDirectory() || entry.name.startsWith('[') || entry.name === '__tests__') continue;
        routes.add(`${prefix}/${entry.name}`);
        walk(join(dir, entry.name), `${prefix}/${entry.name}`);
      }
    };
    walk(root, '/reports');

    const linked = new Set([
      ...REPORT_NAV_GROUPS.flatMap(group => group.items.map(item => item.href)),
      REPORT_NAV_TRAILING.href,
    ]);

    const missing = [...routes].filter(route => !linked.has(route));
    expect(missing, `Report pages not in the nav: ${missing.join(', ')}`).toEqual([]);
  });
});
