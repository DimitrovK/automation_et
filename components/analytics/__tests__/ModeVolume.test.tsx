import type { CareerPathAnalyticsResponse } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ModeVolume } from '@/components/analytics/panels/ModeVolume';

function data(over: Partial<CareerPathAnalyticsResponse['shape']> = {}): CareerPathAnalyticsResponse {
  return {
    shape: {
      // The real 90-day shape, which is the hard case: a 271x spread between
      // the busiest mode and the rarest.
      modes: [
        { mode: 'SINGLE', paths: 7854, appearances: 13000, solve_rate_pct: 70.8, help_rate_pct: 2.6 },
        { mode: 'LADDER', paths: 462, appearances: 900, solve_rate_pct: 66.1, help_rate_pct: 3.0 },
        { mode: 'HEAD_TO_HEAD', paths: 175, appearances: 400, solve_rate_pct: 83.8, help_rate_pct: 2.1 },
        { mode: 'RACE', paths: 29, appearances: 60, solve_rate_pct: 58.7, help_rate_pct: 5.1 },
      ],
      total_paths: 8520,
      footballers_per_path: 1.7,
      ...over,
    },
  } as unknown as CareerPathAnalyticsResponse;
}

describe('modeVolume', () => {
  it('gives every mode a count and a share', () => {
    render(<ModeVolume data={data()} />);

    expect(screen.getByText('7,854')).toBeInTheDocument();
    expect(screen.getByText('92.2%')).toBeInTheDocument();
    expect(screen.getByText('462')).toBeInTheDocument();
    expect(screen.getByText('5.4%')).toBeInTheDocument();
  });

  it('leads with the total', () => {
    render(<ModeVolume data={data()} />);

    expect(screen.getByText('8,520')).toBeInTheDocument();
    expect(screen.getByText(/1.7 footballers per game/)).toBeInTheDocument();
  });

  it('ranks by volume', () => {
    render(<ModeVolume data={data()} />);

    expect(screen.getAllByRole('term').map(node => node.textContent))
      .toEqual(['Single', 'Ladder', 'Head to Head', 'Race']);
  });

  it('re-sorts rather than trusting the payload order', () => {
    // Read as a ranking, so it cannot depend on an ordering the response is not
    // contracted to hold.
    render(
      <ModeVolume
        data={data({
          modes: [
            { mode: 'RACE', paths: 29, appearances: 60, solve_rate_pct: 58.7, help_rate_pct: 5.1 },
            { mode: 'SINGLE', paths: 7854, appearances: 13000, solve_rate_pct: 70.8, help_rate_pct: 2.6 },
          ],
        } as Partial<CareerPathAnalyticsResponse['shape']>)}
      />,
    );

    expect(screen.getAllByRole('term').map(node => node.textContent)).toEqual(['Single', 'Race']);
  });

  it('never rounds a mode that WAS played down to zero', () => {
    // 3 of 8,520 is 0.035%. Printed as "0.0%" it claims the mode was never
    // played, which is a different fact from "played, barely".
    render(
      <ModeVolume
        data={data({
          modes: [
            { mode: 'SINGLE', paths: 7854, appearances: 13000, solve_rate_pct: 70.8, help_rate_pct: 2.6 },
            { mode: 'RACE', paths: 3, appearances: 6, solve_rate_pct: null, help_rate_pct: null },
          ],
        } as Partial<CareerPathAnalyticsResponse['shape']>)}
      />,
    );

    expect(screen.getByText('<0.1%')).toBeInTheDocument();
  });

  it('keeps the rarest mode visible as a bar, not as nothing', () => {
    // 29 against 7,854 is 0.4% of the track — no pixels at all without a floor,
    // which reads as a mode nobody played.
    render(<ModeVolume data={data()} />);

    const bar = screen.getByRole('img', { name: /^Race: 29/ });
    const fill = bar.firstElementChild as HTMLElement;

    expect(Number.parseFloat(fill.style.width)).toBeGreaterThanOrEqual(1);
  });

  it('says nothing was played rather than drawing an empty ranking', () => {
    render(<ModeVolume data={data({ modes: [], total_paths: 0, footballers_per_path: null } as Partial<CareerPathAnalyticsResponse['shape']>)} />);

    expect(screen.getByText('No games were started in this window.')).toBeInTheDocument();
    expect(screen.queryByText(/scaled to the busiest mode/)).not.toBeInTheDocument();
  });
});
