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
    // different fact from one nobody has played enough to rate. A count alone
    // does not resolve it either — the reader cannot tell WHICH bar is missing
    // (Copilot on #127).
    render(<ModeRates data={data([SINGLE, RARE])} />);

    expect(screen.getByText(/race/)).toBeInTheDocument();
    expect(screen.getByText(/under 30 appearances/)).toBeInTheDocument();
  });

  it('separates "too few to rate" from "nothing to rate at all"', () => {
    // Two different reasons drop a mode, and one message for both picks the
    // wrong one for somebody.
    render(
      <ModeRates
        data={data([SINGLE, RARE, { mode: 'SUDDEN_DEATH', paths: 0, appearances: 0, solve_rate_pct: null, help_rate_pct: null }])}
      />,
    );

    expect(screen.getByText(/under 30 appearances.*race/)).toBeInTheDocument();
    expect(screen.getByText(/No appearances to rate at all: sudden death/)).toBeInTheDocument();
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
