import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Distribution } from '@/components/reports/primitives/Distribution';

const BANDS = [
  { label: 'Easy', count: 2231, pct: 30.9 },
  { label: 'Normal', count: 2228, pct: 30.9 },
  { label: 'Hard', count: 1946, pct: 27 },
  { label: 'Extreme', count: 813, pct: 11.3 },
];

describe('distribution', () => {
  it('draws nothing for an empty distribution', () => {
    // Not a row of zero-width bars: that implies a measurement never taken.
    render(<Distribution bands={[{ label: 'Easy', count: 0, pct: 0 }]} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('gives each band its own colour when asked, and a dot to match', () => {
    // Difficulty is the case where a reader wants to spot one tier without
    // reading four labels, so it gets real hues rather than one at four opacities.
    const { container } = render(
      <Distribution bands={BANDS} bandColours={['bg-green-500', 'bg-blue-500', 'bg-orange-500', 'bg-red-500']} />,
    );

    for (const hue of ['bg-green-500', 'bg-blue-500', 'bg-orange-500', 'bg-red-500']) {
      // Once in the bar, once as the dot beside its label.
      expect(container.querySelectorAll(`.${hue}`)).toHaveLength(2);
    }
  });

  it('does not dim a band that has its own colour', () => {
    // Opacity across bands is right for a scale rendered in one hue. Applied on
    // top of four real colours it just undoes them.
    const { container } = render(
      <Distribution bands={BANDS} colour="#0ea5e9" bandColours={['bg-green-500', 'bg-blue-500', 'bg-orange-500', 'bg-red-500']} />,
    );

    const segments = [...container.querySelectorAll('span[title]')];

    expect(segments).toHaveLength(4);

    for (const segment of segments) {
      // Asserted on the style ATTRIBUTE rather than `.style.opacity`: the
      // `prefer-to-have-style` rule rejects the property access, and its own
      // autofix produces invalid syntax for an empty expected value.
      expect(segment.getAttribute('style')).not.toContain('opacity');
    }
  });

  it('still varies one hue by opacity when that is all it is given', () => {
    // The single-colour default is right for a genuine scale, and must survive.
    const { container } = render(<Distribution bands={BANDS} colour="#0ea5e9" />);

    const segments = [...container.querySelectorAll('span[title]')];
    const opacities = segments.map(s => (s as HTMLElement).style.opacity);

    expect(new Set(opacities).size).toBe(4);
  });

  it('takes widths from the counts, not the rounded percentages', () => {
    // Rounding each band on its own is right for the label and wrong for the
    // geometry, where the remainders have to add up or the bar has a gap.
    const { container } = render(<Distribution bands={[{ label: 'A', count: 1, pct: 33.3 }, { label: 'B', count: 2, pct: 66.7 }]} />);

    const widths = [...container.querySelectorAll('span[title]')]
      .map(s => Number.parseFloat((s as HTMLElement).style.width));

    // 1:2 exactly. Widths from the rounded 33.3/66.7 would not sum to 100.
    expect(widths[0]).toBeCloseTo(100 / 3, 6);
    expect(widths[1]).toBeCloseTo(200 / 3, 6);
  });
});
