import type { CatalogueTotals, CoverageResponse } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CatalogueGrowth } from '@/components/analytics/panels/CatalogueGrowth';

// jsdom gives recharts a zero-size container, so the areas never render. What is
// worth asserting is the framing around them: the figures, and the key that says
// which band is which.
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 800, height: 300 }}>{children}</div>
    ),
  };
});

const TOTALS: CatalogueTotals = {
  footballers_added: 1709,
  teams_added: 825,
  footballers_approved: 6729,
  teams_approved: 4455,
  nations_active: 233,
  nations_total: 236,
  nations_last_added: '2026-06-27T21:05:56Z',
};

function data(totals?: CatalogueTotals): CoverageResponse {
  return {
    totals,
    added_series: totals
      ? [
          { date: '2026-04-09', footballers: 13, teams: 10 },
          { date: '2026-04-10', footballers: 12, teams: 1 },
        ]
      : undefined,
  } as unknown as CoverageResponse;
}

describe('catalogueGrowth', () => {
  it('renders nothing when the backend has not shipped the fields yet', () => {
    const { container } = render(<CatalogueGrowth data={data(undefined)} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('leads with what arrived in the window, not the standing total', () => {
    render(<CatalogueGrowth data={data(TOTALS)} />);

    expect(screen.getByText('Footballers added')).toBeInTheDocument();
    expect(screen.getByText('1,709')).toBeInTheDocument();
    expect(screen.getByText('825 teams in the same window')).toBeInTheDocument();
  });

  it('calls the nations tile "active", never "approved"', () => {
    // `Nation` has no status field. Naming it approved would name a review step
    // that does not exist for countries.
    render(<CatalogueGrowth data={data(TOTALS)} />);

    expect(screen.getByText('Active nations')).toBeInTheDocument();
    expect(screen.queryByText(/Approved nations/i)).not.toBeInTheDocument();
  });

  it('accounts for the nations that are not active', () => {
    render(<CatalogueGrowth data={data(TOTALS)} />);

    expect(screen.getByText(/3 defunct/)).toBeInTheDocument();
  });

  it('gives the two-series chart a legend', () => {
    render(<CatalogueGrowth data={data(TOTALS)} />);

    expect(screen.getByText('Footballers')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
  });
});
