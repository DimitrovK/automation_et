import type { CareerPathAnalyticsResponse } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ModeRates } from '@/components/analytics/charts/ModeRates';

// jsdom gives recharts a zero-size container, so the bars never render. What is
// worth asserting is the decision above them: which modes are shown at all, and
// whether the ones left out are named.
vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 800, height: 300 }}>{children}</div>
    ),
  };
});

function data(modes: CareerPathAnalyticsResponse['shape']['modes']): CareerPathAnalyticsResponse {
  return {
    shape: { modes },
  } as unknown as CareerPathAnalyticsResponse;
}

const SINGLE = { mode: 'SINGLE', paths: 100, appearances: 25131, solve_rate_pct: 70.8, help_rate_pct: 2.6 };
const RARE = { mode: 'RACE', paths: 2, appearances: 12, solve_rate_pct: 58.7, help_rate_pct: 5.1 };

describe('modeRates', () => {
  it('names the modes it left out rather than dropping them silently', () => {
    // A mode missing from a chart reads as a mode nobody plays, which is a
    // different fact from one nobody has played enough to rate.
    render(<ModeRates data={data([SINGLE, RARE])} />);

    expect(screen.getByText(/1 mode is left out/)).toBeInTheDocument();
    expect(screen.getByText(/under 30 appearances/)).toBeInTheDocument();
  });

  it('says nothing about omissions when every mode qualifies', () => {
    render(<ModeRates data={data([SINGLE])} />);

    expect(screen.queryByText(/left out/)).not.toBeInTheDocument();
  });

  it('shows an empty state when no mode has enough appearances', () => {
    render(<ModeRates data={data([RARE])} />);

    expect(screen.getByText('No mode has enough appearances to rate.')).toBeInTheDocument();
  });
});
