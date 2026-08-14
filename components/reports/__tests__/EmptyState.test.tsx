import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmptyState } from '@/components/reports/EmptyState';

describe('emptyState', () => {
  it('says what is missing', () => {
    render(<EmptyState>No multiplayer rooms in this window.</EmptyState>);

    expect(screen.getByText('No multiplayer rooms in this window.')).toBeInTheDocument();
  });

  it('adds nothing when there is no hint', () => {
    // An empty second line still takes height, so two empty panels side by side
    // would settle at different heights depending on whether one had a hint.
    const { container } = render(<EmptyState>Nothing here.</EmptyState>);

    expect(container.querySelectorAll('p')).toHaveLength(1);
  });

  it('shows the hint when there is something to suggest', () => {
    render(<EmptyState hint="Try a wider date range.">No favourites were added.</EmptyState>);

    expect(screen.getByText('Try a wider date range.')).toBeInTheDocument();
  });
});

describe('no panel writes its own empty state', () => {
  it('has no hand-rolled centred muted paragraph', () => {
    // Ten of these existed at three different paddings, and half said some
    // version of "No data yet" — which tells a reader nothing they had not
    // already deduced from the blank panel.
    //
    // Matches the empty-state signature — vertical padding plus centring — so
    // that an explanatory notice (all-round padding, says why a panel is
    // hidden rather than that it is empty) is not swept into a rule with
    // nowhere sensible to send it.
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

    const offenders = files
      .filter(file => !file.endsWith('EmptyState.tsx'))
      .filter(file => /<p className="[^"]*\bpy-\d[^"]*text-center text-sm text-muted-foreground/.test(readFileSync(file, 'utf8')));

    expect(
      offenders.map(f => f.replace(process.cwd(), '')),
      'Use EmptyState, and say what would change the result',
    ).toEqual([]);
  });
});
