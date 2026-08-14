import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FilterGroup } from '@/components/reports/FilterBar';

describe('filterGroup', () => {
  it('names the control it wraps', () => {
    render(<FilterGroup label="Range"><button type="button">7d</button></FilterGroup>);

    expect(screen.getByText('Range')).toBeInTheDocument();
  });

  it('renders no caption text when a control has no name of its own', () => {
    // A clear button belongs to the range beside it, so it has no name — but it
    // still needs the caption's height reserved or it sits a line too high.
    const { container } = render(<FilterGroup><button type="button">Clear</button></FilterGroup>);

    // A non-breaking space holds the line; nothing readable is added.
    expect(container.textContent?.replace(/\u00A0/g, '')).toBe('Clear');
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });

  it('would still announce a blank caption if one were passed', () => {
    // The first attempt reserved the space with `label="&nbsp;"`. That does NOT
    // print the six characters — JSX decodes entities in an attribute literal,
    // so it renders a real non-breaking space (a review flagged it as a
    // rendering bug; it measured out otherwise).
    //
    // It is still the wrong shape, for the reason this asserts: the caption is
    // a real <p> in the accessibility tree with nothing in it to say. Omitting
    // the label renders an aria-hidden spacer instead.
    const { container } = render(
      <FilterGroup label="&nbsp;"><button type="button">Clear</button></FilterGroup>,
    );
    const caption = container.querySelector('p');

    expect(caption?.textContent).toBe('\u00A0');
    expect(caption).not.toHaveAttribute('aria-hidden');
  });

  it('keeps the spacer out of the accessibility tree', () => {
    // Reserved space is a layout concern; announcing it would be noise.
    const { container } = render(<FilterGroup><button type="button">Clear</button></FilterGroup>);
    const spacer = container.querySelector('p');

    expect(spacer).toHaveAttribute('aria-hidden');
  });
});

describe('every filtered report page uses the bar', () => {
  it('has no page laying filters out by hand', async () => {
    // The filters were a bare row of buttons on ten pages, each spacing itself
    // slightly differently. A page that renders RangePicker outside FilterBar
    // drifts back to that — and nothing else would notice, because it still
    // works.
    const { readdirSync, readFileSync } = await import('node:fs');
    const { join } = await import('node:path');

    const root = join(process.cwd(), 'app', 'reports');
    const pages: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else if (entry.name === 'page.tsx') {
          pages.push(full);
        }
      }
    };
    walk(root);

    const offenders = pages.filter((file) => {
      const source = readFileSync(file, 'utf8');
      if (!source.includes('<RangePicker')) {
        return false;
      }
      return !source.includes('<FilterBar>');
    });

    expect(
      offenders.map(f => f.replace(process.cwd(), '')),
      'Report pages with filters outside FilterBar',
    ).toEqual([]);
  });
});
