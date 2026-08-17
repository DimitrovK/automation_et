import type { CoverageResponse } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EraAndPools } from '@/components/analytics/panels/EraAndPools';

function data(over: Partial<CoverageResponse> = {}): CoverageResponse {
  return {
    eras: [
      { era: 'Before 1950', by_difficulty: [16, 40, 79, 149], total: 284 },
      { era: '2000s', by_difficulty: [138, 230, 258, 213], total: 839 },
    ],
    game_pools: [
      { key: 'grid', label: 'Grid', by_difficulty: [955, 1584, 2457, 1728], total: 6724 },
    ],
    catalogue: 6729,
    ...over,
  } as unknown as CoverageResponse;
}

describe('eraAndPools', () => {
  it('renders nothing before the backend ships the fields', () => {
    const { container } = render(<EraAndPools data={{} as CoverageResponse} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('keeps the oldest bucket named rather than dated', () => {
    render(<EraAndPools data={data()} />);

    expect(screen.getByText('Before 1950')).toBeInTheDocument();
    expect(screen.getByText('284')).toBeInTheDocument();
  });

  it('reads each era as its difficulty split, for anyone who cannot see it', () => {
    render(<EraAndPools data={data()} />);

    expect(
      screen.getByRole('img', { name: 'Before 1950: 16 easy, 40 normal, 79 hard, 149 extreme' }),
    ).toBeInTheDocument();
  });

  it('says what a pool is a share of', () => {
    // "6,724" means nothing without the catalogue it is drawn from.
    render(<EraAndPools data={data()} />);

    expect(screen.getByText(/Of 6,729 approved footballers/)).toBeInTheDocument();
  });

  it('scales the bars against the biggest row, not each row', () => {
    // Each row scaled to itself would make every bar full width and say nothing
    // about size — the 284 era would look like the 839 one.
    const { container } = render(<EraAndPools data={data()} />);
    const segments = [...container.querySelectorAll('[role="img"] > span')];
    const firstEra = segments.slice(0, 4).map(s => Number.parseFloat((s as HTMLElement).style.width));

    // 16 of the largest total (839), not 16 of 284.
    expect(firstEra[0]).toBeCloseTo((16 / 839) * 100, 1);
  });

  it('shows one panel when only one has arrived', () => {
    render(<EraAndPools data={data({ game_pools: undefined })} />);

    expect(screen.getByText('When they were born')).toBeInTheDocument();
    expect(screen.queryByText('What each game can draw on')).not.toBeInTheDocument();
  });
});
