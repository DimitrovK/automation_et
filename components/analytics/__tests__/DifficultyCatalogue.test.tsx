import type { CoverageResponse, DifficultyTier } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DifficultyCatalogue } from '@/components/analytics/panels/DifficultyCatalogue';

function data(tiers?: DifficultyTier[]): CoverageResponse {
  return { difficulty_tiers: tiers } as unknown as CoverageResponse;
}

const FULL: DifficultyTier[] = [
  { difficulty: 'EASY', footballers: 955, with_picture: 282, with_picture_pct: 29.5 },
  { difficulty: 'NORMAL', footballers: 1589, with_picture: 271, with_picture_pct: 17.1 },
  { difficulty: 'HARD', footballers: 2457, with_picture: 311, with_picture_pct: 12.7 },
  { difficulty: 'EXTREME', footballers: 1728, with_picture: 206, with_picture_pct: 11.9 },
];

describe('difficultyCatalogue', () => {
  it('renders nothing when the backend has not shipped the field yet', () => {
    // The two repositories deploy independently, so this arrives absent rather
    // than empty. An unguarded render is a crash on the page, not a gap in it.
    const { container } = render(<DifficultyCatalogue data={data(undefined)} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('reads each tier as "N of X" rather than a bare percentage', () => {
    render(<DifficultyCatalogue data={data(FULL)} />);

    expect(screen.getByText('282')).toBeInTheDocument();
    expect(screen.getByText('of 955')).toBeInTheDocument();
    expect(screen.getByText('29.5%')).toBeInTheDocument();
  });

  it('never prints "null%" when a populated tier arrives without a percentage', () => {
    // The BE only nulls the percentage for an empty tier, so this is a payload
    // that disagrees with itself — but the type allows it, and a bare
    // interpolation renders the word "null" next to a real count.
    render(
      <DifficultyCatalogue
        data={data([{ difficulty: 'HARD', footballers: 10, with_picture: 4, with_picture_pct: null }])}
      />,
    );

    expect(screen.queryByText(/null/)).not.toBeInTheDocument();
    expect(screen.getByText('of 10')).toBeInTheDocument();
  });

  it('never prints "null%" for a tier with no footballers', () => {
    render(
      <DifficultyCatalogue
        data={data([{ difficulty: 'EASY', footballers: 0, with_picture: 0, with_picture_pct: null }])}
      />,
    );

    expect(screen.queryByText(/null/)).not.toBeInTheDocument();
    expect(screen.getByText('No footballers')).toBeInTheDocument();
  });

  it('describes each bar for a reader who cannot see it', () => {
    render(<DifficultyCatalogue data={data(FULL)} />);

    expect(
      screen.getByLabelText('Easy: 282 of 955 have a picture'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Easy: 955 footballers')).toBeInTheDocument();
  });

  it('keeps the tiers in difficulty order, not the order they arrive', () => {
    render(<DifficultyCatalogue data={data(FULL)} />);

    const labels = screen.getAllByText(/^(Easy|Normal|Hard|Extreme)$/).map(n => n.textContent);

    // Twice — once per column, both in the same order.
    expect(labels).toEqual(['Easy', 'Normal', 'Hard', 'Extreme', 'Easy', 'Normal', 'Hard', 'Extreme']);
  });
});
