import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatTile } from '@/components/reports/StatTile';

describe('statTile', () => {
  it('shows the figure with the name of what it counts', () => {
    render(<StatTile label="Rooms created" value="12,480" />);

    expect(screen.getByText('Rooms created')).toBeInTheDocument();
    expect(screen.getByText('12,480')).toBeInTheDocument();
  });

  it('omits the hint line when there is no hint', () => {
    // An empty <p> still occupies space, which nudges every tile in the row out
    // of alignment with the one that has a hint.
    const { container } = render(<StatTile label="Started" value="8" />);

    expect(container.querySelectorAll('p')).toHaveLength(2);
  });

  it('renders the hint when given one', () => {
    render(<StatTile label="Started" value="8" hint="of the rooms opened" />);

    expect(screen.getByText('of the rooms opened')).toBeInTheDocument();
  });
});

describe('no page keeps its own stat tile', () => {
  it('has no local Tile or Stat component on a report page', () => {
    // Four pages had grown their own copy — two `Tile`, one `Stat`, one inlined
    // — and they had already diverged on the value's size, so the same kind of
    // figure rendered differently depending on which page you were reading.
    // Shared components as well as pages: RetentionTable was rendering its own
    // text-3xl figure and a page-only scan never saw it.
    const roots = [join(process.cwd(), 'app', 'reports'), join(process.cwd(), 'components', 'reports')];
    const pages: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory() && entry.name !== '__tests__') {
          walk(full);
        } else if (entry.name.endsWith('.tsx')) {
          pages.push(full);
        }
      }
    };
    for (const root of roots) {
      walk(root);
    }

    const offenders = pages.filter((file) => {
      const source = readFileSync(file, 'utf8');
      // The signature of a hand-rolled tile: a big bold figure in a card.
      return /function (?:Tile|Stat)\s*\(/.test(source)
        || /text-(?:2xl|3xl) font-bold/.test(source);
    });

    expect(
      offenders.map(f => f.replace(process.cwd(), '')),
      'Use StatTile instead of a page-local tile',
    ).toEqual([]);
  });
});
