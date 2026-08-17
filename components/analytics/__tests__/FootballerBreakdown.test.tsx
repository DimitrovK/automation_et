import type { CoverageResponse } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FootballerBreakdown } from '@/components/analytics/panels/FootballerBreakdown';

function data(over: Record<string, unknown> = {}): CoverageResponse {
  return {
    career_state: {
      retired: 3825,
      active: 2904,
      by_difficulty: [
        { difficulty: 'EASY', retired: 426, active: 529 },
        { difficulty: 'NORMAL', retired: 807, active: 782 },
        { difficulty: 'HARD', retired: 1559, active: 898 },
        { difficulty: 'EXTREME', retired: 1033, active: 695 },
      ],
    },
    ...over,
  } as unknown as CoverageResponse;
}

describe('footballerBreakdown', () => {
  it('renders nothing before the backend ships the field', () => {
    const { container } = render(<FootballerBreakdown data={{} as CoverageResponse} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the count AND its share', () => {
    // One without the other sends the reader to a calculator.
    render(<FootballerBreakdown data={data()} />);

    expect(screen.getByText('3,825')).toBeInTheDocument();
    expect(screen.getByText('56.8%')).toBeInTheDocument();
    expect(screen.getByText('2,904')).toBeInTheDocument();
    expect(screen.getByText('43.2%')).toBeInTheDocument();
  });

  it('lists still-playing before retired, matching the stack beneath it', () => {
    // A legend order that disagrees with the chart is a puzzle.
    render(<FootballerBreakdown data={data()} />);

    const labels = screen.getAllByRole('term').map(t => t.textContent);

    expect(labels).toEqual(['Still playing', 'Retired']);
  });

  it('shows no share at all when there is nothing to take one of', () => {
    render(<FootballerBreakdown data={data({ career_state: { retired: 0, active: 0, by_difficulty: [] } })} />);

    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });
});
