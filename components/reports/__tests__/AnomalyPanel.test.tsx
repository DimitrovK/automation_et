import type { AnomaliesResponse, AnomalyFinding } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnomalyPanel } from '@/components/reports/panels/AnomalyPanel';

const META = { grid: { key: 'grid', label: 'Grid', color: '#10b981' } };

function build(overrides: Partial<AnomaliesResponse> = {}): AnomaliesResponse {
  return {
    start: '2026-08-01',
    end: '2026-08-14',
    days: 14,
    window: 14,
    game_type: null,
    include_bots: false,
    window_days: 14,
    compared_with: { start: '2026-07-18', end: '2026-07-31' },
    thresholds: { min_volume: 30, min_change_pct: 25, severe_change_pct: 50, sigma: 3 },
    coverage: { complete: true, missing_days: [] },
    findings: [],
    ...overrides,
  };
}

function finding(overrides: Partial<AnomalyFinding> = {}): AnomalyFinding {
  return {
    scope: 'game',
    game_type: 'grid',
    metric: 'games_started',
    change_pct: -47,
    current: 637,
    previous: 1203,
    z_score: -12.9,
    required_pct: 20,
    severity: 'high',
    headline: 'grid down 47%',
    detail: '637 games against 1,203 in the previous 14 days.',
    ...overrides,
  };
}

describe('anomalyPanel', () => {
  // The bug this class of test exists to stop: an empty list rendering as
  // reassurance when the real reason is that the days were never computed.
  it('does not claim things are fine when the data is incomplete', () => {
    render(
      <AnomalyPanel
        data={build({ coverage: { complete: false, missing_days: ['2026-08-03'] } })}
        meta={META}
      />,
    );

    expect(screen.queryByText(/nothing unusual/i)).not.toBeInTheDocument();
    expect(screen.getByText(/not enough data to tell/i)).toBeInTheDocument();
  });

  it('says nothing is wrong only when the window is fully computed', () => {
    render(<AnomalyPanel data={build()} meta={META} />);

    expect(screen.getByText(/nothing unusual/i)).toBeInTheDocument();
  });

  it('warns that a findings list may be incomplete when days are missing', () => {
    render(
      <AnomalyPanel
        data={build({
          coverage: { complete: false, missing_days: ['2026-08-03'] },
          findings: [{
            scope: 'game',
            game_type: 'grid',
            metric: 'games_started',
            change_pct: -47,
            current: 637,
            previous: 1203,
            z_score: 3.4,
            required_pct: 20,
            severity: 'medium',
            headline: 'Grid down 47.0%',
            detail: '637 games started, down from 1,203.',
          }],
        })}
        meta={META}
      />,
    );

    expect(screen.getByText(/may be incomplete/i)).toBeInTheDocument();
  });

  it('surfaces the thresholds so a reader knows what was filtered out', () => {
    render(<AnomalyPanel data={build()} meta={META} />);

    // Without these numbers, "nothing unusual" is an unfalsifiable claim.
    expect(screen.getByText(/25%/)).toBeInTheDocument();
    expect(screen.getByText(/30 sessions/)).toBeInTheDocument();
    // And the sigma bar, which is the part that actually decides now (#1474 R8).
    // The percentage alone reads as a flat rule and is why someone would ask
    // why a +28% game is missing.
    expect(screen.getByText(/3 standard deviations/)).toBeInTheDocument();
  });

  it('says what the bar was at that volume, beside the finding', () => {
    // The panel has to be able to explain an OMISSION. Seeing +28% absent
    // without this, a reader concludes the panel is broken rather than that 28%
    // is what a game that size does on a quiet week.
    render(<AnomalyPanel data={build({ findings: [finding()] })} meta={META} />);

    expect(screen.getByText(/a move of 20% would have been the bar/)).toBeInTheDocument();
  });
});
