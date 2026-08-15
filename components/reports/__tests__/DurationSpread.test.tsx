import type { DurationRow } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DurationSpread } from '@/components/reports/charts/DurationSpread';

function row(over: Partial<DurationRow>): DurationRow {
  return {
    game_type: 'team_ties',
    supported: true,
    reason: null,
    sessions: 100,
    measured: 100,
    coverage_pct: 100,
    median_seconds: 312,
    p90_seconds: 577,
    p25_seconds: 197,
    p75_seconds: 436,
    long_sessions: 0,
    long_sessions_pct: 0,
    single_sitting: true,
    ...over,
  } as DurationRow;
}

describe('durationSpread', () => {
  it('shows where the middle half of sessions sit', () => {
    render(<DurationSpread row={row({})} />);

    expect(screen.getByText('3.3m–7.3m')).toBeInTheDocument();
  });

  it('names every percentile behind the bar', () => {
    // The bar is a shape; someone comparing two games needs the numbers.
    const { container } = render(<DurationSpread row={row({})} />);

    expect(container.firstElementChild?.getAttribute('title'))
      .toBe('25% of sessions under 3.3m · half under 5.2m · 75% under 7.3m · 90% under 9.6m');
  });

  it('scales against p90, so a sprawling game does not look like a tight one', () => {
    // Scaled to p75, every game's bar would end at the right edge and they
    // would all look identical — which destroys the only thing this control is
    // for. Scout's middle half runs to 28 minutes with a tail of days; Team
    // Ties' runs to seven minutes. Those must not draw the same.
    const tight = render(<DurationSpread row={row({})} />);
    const tightWidth = tight.container.querySelector('span[style*="width"]')?.getAttribute('style');

    const sprawl = render(
      <DurationSpread row={row({ p25_seconds: 186, median_seconds: 411, p75_seconds: 1726, p90_seconds: 931565 })} />,
    );
    const sprawlWidth = sprawl.container.querySelector('span[style*="width"]')?.getAttribute('style');

    const percent = (style?: string | null) => Number(/width: ([\d.]+)%/.exec(style ?? '')?.[1] ?? 0);

    expect(percent(tightWidth)).toBeGreaterThan(percent(sprawlWidth));
    expect(percent(sprawlWidth)).toBeLessThan(5);
  });

  it('draws nothing but a dash when the backend predates the quartiles', () => {
    // A bar drawn from a median alone would be a shape with no data behind it
    // — worse than an obvious gap, because it looks measured.
    render(<DurationSpread row={row({ p25_seconds: undefined, p75_seconds: undefined })} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('draws a dash for a game with no median at all', () => {
    render(<DurationSpread row={row({ median_seconds: null })} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });
});
