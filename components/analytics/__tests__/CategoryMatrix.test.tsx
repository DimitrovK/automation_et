import type { QuestionBankResponse } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CategoryMatrix } from '@/components/analytics/panels/CategoryMatrix';

function data(over: Partial<QuestionBankResponse> = {}): QuestionBankResponse {
  return {
    difficulty_order: ['EASY', 'NORMAL', 'HARD', 'EXTREME'],
    search: null,
    category_matrix: {
      items: [
        { category: 'England', slug: 'england', total: 956, by_difficulty: [277, 290, 276, 113] },
        { category: 'Italy', slug: 'italy', total: 928, by_difficulty: [282, 295, 249, 102] },
      ],
      total: 2017,
      limit: 10,
    },
    ...over,
  } as unknown as QuestionBankResponse;
}

describe('categoryMatrix', () => {
  it('says the rows do not sum to the bank, rather than leaving it to be found', () => {
    // The one figure on the page that deliberately double-counts: most
    // questions carry more than one category.
    render(<CategoryMatrix data={data()} />);

    expect(screen.getByText(/sum to more than the bank holds/)).toBeInTheDocument();
  });

  it('lays the difficulties out as columns in order', () => {
    render(<CategoryMatrix data={data()} />);

    const headers = screen.getAllByRole('columnheader').map(h => h.textContent);

    expect(headers).toEqual(['Category', 'Easy', 'Normal', 'Hard', 'Extreme', 'Total']);
  });

  it('shows each cell and the row total', () => {
    render(<CategoryMatrix data={data()} />);

    expect(screen.getByText('277')).toBeInTheDocument();
    expect(screen.getByText('113')).toBeInTheDocument();
    expect(screen.getByText('956')).toBeInTheDocument();
  });

  it('reports the real category count, not the rows rendered', () => {
    render(<CategoryMatrix data={data()} />);

    expect(screen.getByText('Showing 2 of 2,017')).toBeInTheDocument();
  });

  it('says which search found nothing, rather than just "no data"', () => {
    render(
      <CategoryMatrix
        data={data({
          search: 'zzz',
          category_matrix: { items: [], total: 0, limit: 10 },
        })}
      />,
    );

    expect(screen.getByText('No category matches "zzz".')).toBeInTheDocument();
  });

  it('leaves an empty cell unshaded so a gap is visible', () => {
    // A zero tinted the lightest shade of "some" is a gap you cannot see, and
    // the gaps are the reason to read this table.
    const { container } = render(
      <CategoryMatrix
        data={data({
          category_matrix: {
            items: [{ category: 'Thin', slug: 'thin', total: 5, by_difficulty: [5, 0, 0, 0] }],
            total: 1,
            limit: 10,
          },
        })}
      />,
    );

    const zeroCells = [...container.querySelectorAll('span')].filter(el => el.textContent === '0');

    expect(zeroCells.length).toBe(3);

    for (const cell of zeroCells) {
      expect(cell).not.toHaveAttribute('style');
    }
  });
});
