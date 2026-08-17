import type { DifficultyMatrixResponse } from '@/types/reports';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FootballerMatrix } from '@/components/analytics/panels/FootballerMatrix';

function data(over: Partial<DifficultyMatrixResponse> = {}): DifficultyMatrixResponse {
  return {
    dimension: 'nation',
    dimension_label: 'Nation',
    rows_double_count: false,
    difficulty_order: ['EASY', 'NORMAL', 'HARD', 'EXTREME'],
    search: null,
    difficulty: null,
    matrix: {
      items: [{ key: '1', name: 'England', total: 467, by_difficulty: [100, 127, 164, 76] }],
      total: 132,
      limit: 10,
    },
    ...over,
  } as DifficultyMatrixResponse;
}

const props = {
  dimension: 'nation',
  onDimensionChange: vi.fn(),
  search: '',
  onSearchChange: vi.fn(),
  difficulty: null,
  onDifficultyChange: vi.fn(),
};

describe('footballerMatrix', () => {
  it('says the nation rows add up', () => {
    render(<FootballerMatrix data={data()} {...props} />);

    expect(screen.getByText(/A footballer has one nation, so these rows add up/)).toBeInTheDocument();
  });

  it('warns that team rows do NOT add up, and why a squad looks smaller here', () => {
    // Two things a reader would otherwise take as bugs: the same footballer in
    // several rows, and a squad count below the one on the teams page.
    render(
      <FootballerMatrix
        data={data({ dimension: 'team', dimension_label: 'Team', rows_double_count: true })}
        {...props}
        dimension="team"
      />,
    );

    expect(screen.getByText(/belongs to every club they played for/)).toBeInTheDocument();
    expect(screen.getByText(/Approved footballers only, which is why a squad here is smaller/)).toBeInTheDocument();
  });

  it('names the row column after the dimension', () => {
    render(<FootballerMatrix data={data()} {...props} />);

    expect(screen.getAllByRole('columnheader')[0]).toHaveTextContent('Nation');
  });

  it('switching dimension is a refetch, not a re-slice', () => {
    const onDimensionChange = vi.fn();
    render(<FootballerMatrix data={data()} {...props} onDimensionChange={onDimensionChange} />);

    fireEvent.click(screen.getByRole('button', { name: 'By team' }));

    expect(onDimensionChange).toHaveBeenCalledWith('team');
  });

  it('offers a ranking toggle per tier', () => {
    render(<FootballerMatrix data={data()} {...props} />);

    for (const label of ['Easy', 'Normal', 'Hard', 'Extreme']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });
});
