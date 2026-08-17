import type { CoverageResponse } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { EraAndPools } from '@/components/analytics/panels/EraAndPools';

// jsdom gives recharts a zero-size container, so bars and axis ticks never
// render. What matters here is what identifies them: the legend and the
// text alternative.
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 800, height: 300 }}>{children}</div>
    ),
  };
});

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

  it('names all four difficulties in a legend', () => {
    // The whole complaint about the segmented version: four series and nothing
    // saying which was which.
    render(<EraAndPools data={data({ game_pools: undefined })} />);

    for (const label of ['Easy', 'Normal', 'Hard', 'Extreme']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('carries every bucket and count as text, not only as bars', () => {
    // A chart in a zero-height container, a screen reader, and a printout all
    // need the numbers to exist outside the SVG.
    render(<EraAndPools data={data({ game_pools: undefined })} />);

    expect(
      screen.getByText(/Before 1950 — Easy 16, Normal 40, Hard 79, Extreme 149/),
    ).toBeInTheDocument();
    expect(screen.getByText(/2000s — Easy 138/)).toBeInTheDocument();
  });

  it('says what a pool is a share of', () => {
    // "6,724" means nothing without the catalogue it is drawn from.
    render(<EraAndPools data={data()} />);

    expect(screen.getByText(/Of 6,729 approved footballers/)).toBeInTheDocument();
  });

  it('keeps the oldest bucket named rather than dated', () => {
    render(<EraAndPools data={data({ game_pools: undefined })} />);

    expect(screen.getByText(/Before 1950/)).toBeInTheDocument();
  });

  it('shows one panel when only one has arrived', () => {
    render(<EraAndPools data={data({ game_pools: undefined })} />);

    expect(screen.getByText('When they were born')).toBeInTheDocument();
    expect(screen.queryByText('What each game can draw on')).not.toBeInTheDocument();
  });
});
