import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GameBadge } from '@/components/reports/GameBadge';

const META = {
  team_ties: {
    key: 'team_ties',
    label: 'Team Ties Game Sessions',
    display_name: 'Team Ties',
    color: '#0d9488',
    color_dark: '#0d9488',
  },
} as never;

describe('gameBadge', () => {
  it('is a link when it has somewhere to go', () => {
    // The bug this replaces: with no onClick the badge rendered a DISABLED
    // button, and the games table wrapped that in a <Link>. A disabled button
    // swallows the click rather than letting it reach the anchor, so the only
    // route to a per-game report could not be clicked at all.
    render(<GameBadge gameKey="team_ties" meta={META} href="/reports/games/team_ties" />);
    const link = screen.getByRole('link', { name: /Team Ties/ });

    expect(link).toHaveAttribute('href', '/reports/games/team_ties');
  });

  it('is reachable by keyboard', () => {
    // A disabled button takes no focus, so the old markup was unreachable by
    // keyboard as well as unclickable — worth its own assertion, because a
    // link that renders is not necessarily a link anyone can get to.
    render(<GameBadge gameKey="team_ties" meta={META} href="/reports/games/team_ties" />);

    expect(screen.getByRole('link', { name: /Team Ties/ })).not.toHaveAttribute('tabindex', '-1');
  });

  it('is a button when it filters', () => {
    render(<GameBadge gameKey="team_ties" meta={META} active onClick={() => {}} />);
    const button = screen.getByRole('button', { name: /Team Ties/ });

    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toBeEnabled();
  });

  it('is neither when it is only a label', () => {
    // Not a disabled button: that announces a control which cannot be operated,
    // for something that was never a control.
    render(<GameBadge gameKey="team_ties" meta={META} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Team Ties')).toBeInTheDocument();
  });

  it('never renders a disabled control', () => {
    // The regression in one line, for all three shapes.
    for (const props of [{}, { href: '/x' }, { onClick: () => {} }]) {
      const { container, unmount } = render(<GameBadge gameKey="team_ties" meta={META} {...props} />);

      expect(container.querySelector('[disabled]')).toBeNull();

      unmount();
    }
  });
});

describe('every game on the reporting surface can be opened', () => {
  it('has no badge wrapped in a link instead of carrying one', () => {
    // Wrapping is what broke it. A badge that needs to navigate takes `href`;
    // anything else nests interactive elements, which is invalid and — when the
    // inner one is disabled — silently dead.
    const roots = [join(process.cwd(), 'app', 'reports'), join(process.cwd(), 'components', 'reports')];
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== '__tests__') {
          walk(full);
        } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
          files.push(full);
        }
      }
    };
    for (const root of roots) {
      walk(root);
    }

    expect(files.length, 'walk found no files — this guard would pass vacuously')
      .toBeGreaterThan(10);

    const offenders = files.filter(file =>
      /<Link[^>]*>\s*(?:\{\/\*(?:.|\n)*?\*\/\}\s*)?<GameBadge/.test(readFileSync(file, 'utf8')));

    expect(
      offenders.map(f => f.replace(process.cwd(), '')),
      'Pass href to GameBadge rather than wrapping it in a Link',
    ).toEqual([]);
  });
});
