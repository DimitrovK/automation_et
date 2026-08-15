import { render, screen } from '@testing-library/react';
import { BarChart3, BookOpen, Users } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { SectionNav } from '@/components/admin/SectionNav';
import { REPORT_NAV_GROUPS, REPORT_NAV_TRAILING, REPORT_QUICK_LINKS } from '@/components/reports/shell/ReportsNav';
import { USER_HUB_NAV_GROUPS, USER_HUB_NAV_TRAILING } from '@/components/user-hub/UserHubShell';

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

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('People')).toBeInTheDocument();
  });

  it('marks only the current page as current', () => {
    render(<SectionNav groups={GROUPS} />);

    expect(screen.getByRole('link', { name: /Players/ })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /Daily Pulse/ })).not.toHaveAttribute('aria-current');
  });

  it('does not light up the section root on every page', () => {
    // "/reports" is a prefix of every reports URL, so a prefix match would mark
    // Daily Pulse current everywhere — the one bug this nav can plausibly have.
    render(<SectionNav groups={GROUPS} />);

    const current = screen.getAllByRole('link').filter(link => link.getAttribute('aria-current') === 'page');

    expect(current).toHaveLength(1);
  });

  it('omits the caption for a section with a single group', () => {
    // A heading earns its place by telling groups apart. Over one group it only
    // labels the obvious, and User Hub has two destinations where Reports has
    // ten — so the same nav has to work without captions.
    const { container } = render(<SectionNav groups={[{ heading: '', items: GROUPS[0].items }]} />);

    expect(screen.getByRole('link', { name: /Daily Pulse/ })).toBeInTheDocument();
    // No caption element at all — an empty one still takes its line height and
    // margin, so the group would sit oddly low for no visible reason.
    expect(container.querySelector('p')).toBeNull();
  });

  it('keeps reference material out of the groups', () => {
    render(
      <SectionNav
        groups={GROUPS}
        trailing={{ href: '/reports/glossary', label: 'What the numbers mean', icon: BookOpen }}
      />,
    );

    expect(screen.getByRole('link', { name: /What the numbers mean/ })).toBeInTheDocument();
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

  it('offers only dashboard shortcuts that are real destinations', () => {
    // The dashboard card duplicates a handful of hrefs. A shortcut outliving
    // the page it points at is a 404 reached from the front door, and nothing
    // else would catch it.
    const linked = new Set(REPORT_NAV_GROUPS.flatMap(group => group.items.map(item => item.href)));
    const orphans = REPORT_QUICK_LINKS.filter(link => !linked.has(link.href));

    expect(orphans.map(o => o.href), 'quick links pointing nowhere').toEqual([]);
  });

  it('keeps the dashboard shortlist short', () => {
    // A card reprinting the whole nav is the nav with worse typography. The
    // dashboard's job is to get someone moving, not to enumerate.
    expect(REPORT_QUICK_LINKS.length).toBeLessThanOrEqual(4);
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
        if (!entry.isDirectory() || entry.name.startsWith('[') || entry.name === '__tests__') {
          continue;
        }
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

describe('user hub nav groups', () => {
  it('covers every user hub page', async () => {
    // Same guard as Reports: a page missing from the nav is unreachable except
    // by URL. Redirect stubs are excluded — /user-hub/analytics exists only to
    // forward its old bookmarks to /reports/favourites, and linking it would
    // send people out of the section on purpose.
    const { readFileSync, readdirSync } = await import('node:fs');
    const { join } = await import('node:path');

    const root = join(process.cwd(), 'app', 'user-hub');
    const routes: string[] = ['/user-hub'];
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('[') || entry.name === '__tests__') {
        continue;
      }
      const page = join(root, entry.name, 'page.tsx');
      if (readFileSync(page, 'utf8').includes('permanentRedirect')) {
        continue;
      }
      routes.push(`/user-hub/${entry.name}`);
    }

    const linked = new Set([
      ...USER_HUB_NAV_GROUPS.flatMap(group => group.items.map(item => item.href)),
      USER_HUB_NAV_TRAILING.href,
    ]);

    const missing = routes.filter(route => !linked.has(route));

    expect(missing, `User Hub pages not in the nav: ${missing.join(', ')}`).toEqual([]);
  });

  it('points at where favourites went', () => {
    // The section lost a tab. A pointer beats a page that quietly disappears.
    expect(USER_HUB_NAV_TRAILING.href).toBe('/reports/favourites');
  });
});
