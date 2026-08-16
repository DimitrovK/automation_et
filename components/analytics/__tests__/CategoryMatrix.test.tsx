import type { QuestionBankResponse } from '@/types/reports';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
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
    render(<CategoryMatrix data={data()} search="" onSearchChange={vi.fn()} />);

    expect(screen.getByText(/sum to more than the bank holds/)).toBeInTheDocument();
  });

  it('lays the difficulties out as columns in order', () => {
    render(<CategoryMatrix data={data()} search="" onSearchChange={vi.fn()} />);

    const headers = screen.getAllByRole('columnheader').map(h => h.textContent);

    expect(headers).toEqual(['Category', 'Easy', 'Normal', 'Hard', 'Extreme', 'Total']);
  });

  it('shows each cell and the row total', () => {
    render(<CategoryMatrix data={data()} search="" onSearchChange={vi.fn()} />);

    expect(screen.getByText('277')).toBeInTheDocument();
    expect(screen.getByText('113')).toBeInTheDocument();
    expect(screen.getByText('956')).toBeInTheDocument();
  });

  it('reports the real category count, not the rows rendered', () => {
    render(<CategoryMatrix data={data()} search="" onSearchChange={vi.fn()} />);

    expect(screen.getByText('Showing 2 of 2,017')).toBeInTheDocument();
  });

  it('puts the filter on the card it filters', () => {
    // In the page filter bar it sat beside the date range with nothing to say
    // which panel it applied to. It applies to this table alone.
    render(<CategoryMatrix data={data()} search="" onSearchChange={vi.fn()} />);

    expect(screen.getByLabelText('Filter categories in this table')).toBeInTheDocument();
  });

  it('gives each difficulty its own column identity', () => {
    // Difficulty is ordinal, so the columns read cool-to-hot rather than as
    // four unrelated hues — a row is a shape before it is four numbers.
    render(<CategoryMatrix data={data()} search="" onSearchChange={vi.fn()} />);

    const headers = screen.getAllByRole('columnheader').map(h => h.textContent);

    expect(headers).toEqual(['Category', 'Easy', 'Normal', 'Hard', 'Extreme', 'Total']);
  });

  it('says which search found nothing, rather than just "no data"', () => {
    render(
      <CategoryMatrix
        data={data({ search: 'zzz', category_matrix: { items: [], total: 0, limit: 10 } })}
        search="zzz"
        onSearchChange={vi.fn()}
      />,
    );

    expect(screen.getByText('No category matches "zzz".')).toBeInTheDocument();
  });

  it('draws an empty cell as a dash, not a tinted zero', () => {
    // A zero shaded the lightest step of the ramp is a gap you cannot see, and
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
        search=""
        onSearchChange={vi.fn()}
      />,
    );

    // Three empty tiers, each an outlined dash rather than a shaded "0".
    const empty = container.querySelectorAll('.border-dashed');

    expect(empty).toHaveLength(3);
    expect([...empty].every(cell => cell.textContent === '—')).toBe(true);

    // `--tint` is what shades a real value; an empty cell carries none.
    for (const cell of empty) {
      expect(cell).not.toHaveAttribute('style');
    }
  });
});
