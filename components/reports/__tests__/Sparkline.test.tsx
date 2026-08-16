import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Sparkline } from '@/components/reports/primitives/Sparkline';
import { toPath } from '@/lib/sparkline';

describe('toPath', () => {
  it('breaks the line where the data is unknown', () => {
    // `null` is a day the rollup never computed, not a zero. Joined across, the
    // line draws a slope nobody measured; drawn as zero it shows a collapse.
    const path = toPath([10, 12, null, 14, 15]);
    const moves = path.match(/M/g) ?? [];

    // Two subpaths: one before the gap, one after.
    expect(moves).toHaveLength(2);
  });

  it('centres a flat series rather than dividing by zero', () => {
    // Every value equal means no span to scale against. Naively that puts the
    // line along the top edge, which reads as a maximum.
    const path = toPath([5, 5, 5, 5]);

    expect(path).toContain('10.0');
    expect(path).not.toContain('NaN');
  });

  it('draws nothing from a single point, which has no direction', () => {
    expect(toPath([7])).toBe('');
    expect(toPath([null, 7, null])).toBe('');
  });

  it('spans the full height between the lowest and highest values', () => {
    const path = toPath([0, 100]);

    // Bottom and top, inset by the stroke so neither clips.
    expect(path).toContain('18.5');
    expect(path).toContain('1.5');
  });
});

describe('sparkline', () => {
  it('carries a label, so the shape is not the only way to read it', () => {
    render(<Sparkline points={[1, 5, 3]} label="Daily sessions for Grid" />);

    expect(screen.getByRole('img', { name: 'Daily sessions for Grid' })).toBeInTheDocument();
  });

  it('shows a dash rather than an empty box when there is no shape', () => {
    // An empty SVG in a table cell reads as a rendering failure.
    render(<Sparkline points={[4]} label="Daily sessions for Grid" />);

    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('colours by direction, comparing the ends rather than the extremes', () => {
    // A game that spiked mid-window and came back down has not risen.
    const { container: falling } = render(<Sparkline points={[10, 99, 2]} label="x" />);

    expect(falling.querySelector('path')?.getAttribute('class')).toContain('red');

    const { container: rising } = render(<Sparkline points={[2, 1, 10]} label="y" />);

    expect(rising.querySelector('path')?.getAttribute('class')).toContain('emerald');
  });
});
