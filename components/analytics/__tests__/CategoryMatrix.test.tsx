import type { QuestionBankResponse } from '@/types/reports';
import { fireEvent, render, screen } from '@testing-library/react';
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
    render(<CategoryMatrix data={data()} search="" onSearchChange={vi.fn()} difficulty={null} onDifficultyChange={vi.fn()} />);

    expect(screen.getByText(/sum to more than the bank holds/)).toBeInTheDocument();
  });

  it('lays the difficulties out as columns in order', () => {
    render(<CategoryMatrix data={data()} search="" onSearchChange={vi.fn()} difficulty={null} onDifficultyChange={vi.fn()} />);

    const headers = screen.getAllByRole('columnheader').map(h => h.textContent);

    expect(headers).toEqual(['Category', 'Easy', 'Normal', 'Hard', 'Extreme', 'Total', 'Added']);
  });

  it('shows each cell and the row total', () => {
    render(<CategoryMatrix data={data()} search="" onSearchChange={vi.fn()} difficulty={null} onDifficultyChange={vi.fn()} />);

    expect(screen.getByText('277')).toBeInTheDocument();
    expect(screen.getByText('113')).toBeInTheDocument();
    expect(screen.getByText('956')).toBeInTheDocument();
  });

  it('reports the real category count, not the rows rendered', () => {
    render(<CategoryMatrix data={data()} search="" onSearchChange={vi.fn()} difficulty={null} onDifficultyChange={vi.fn()} />);

    expect(screen.getByText('Showing 2 of 2,017')).toBeInTheDocument();
  });

  it('puts the filter on the card it filters', () => {
    // In the page filter bar it sat beside the date range with nothing to say
    // which panel it applied to. It applies to this table alone.
    render(<CategoryMatrix data={data()} search="" onSearchChange={vi.fn()} difficulty={null} onDifficultyChange={vi.fn()} />);

    expect(screen.getByLabelText('Filter categories in this table')).toBeInTheDocument();
  });

  it('gives each difficulty its own column identity', () => {
    // Difficulty is ordinal, so the columns read cool-to-hot rather than as
    // four unrelated hues — a row is a shape before it is four numbers.
    render(<CategoryMatrix data={data()} search="" onSearchChange={vi.fn()} difficulty={null} onDifficultyChange={vi.fn()} />);

    const headers = screen.getAllByRole('columnheader').map(h => h.textContent);

    expect(headers).toEqual(['Category', 'Easy', 'Normal', 'Hard', 'Extreme', 'Total', 'Added']);
  });

  it('gives every cell a visible solid fill, not an opacity tint', () => {
    const { container } = render(<CategoryMatrix data={data()} search="" onSearchChange={vi.fn()} difficulty={null} onDifficultyChange={vi.fn()} />);

    const cells = container.querySelectorAll('[data-difficulty]:not([data-empty])');

    expect(cells.length).toBeGreaterThan(0);

    for (const cell of cells) {
      // No `--tint` custom property: the old cells set their opacity inline.
      expect(cell.getAttribute('style') ?? '').not.toContain('--tint');
      // The light-mode shade specifically — matching only `dark:from-…-950`
      // would let a light theme regress unnoticed.
      // Light theme: two adjacent light steps of the hue, number in its 900.
      expect(cell.className).toMatch(/(^| )(from|to)-(green|blue|orange|red)-(100|300)/);
      expect(cell.className).toMatch(/(^| )text-(green|blue|orange|red)-900/);
      // Dark theme carries its own steps — a dark tile on a light page is a
      // hole punched in it, and the reverse is just as wrong.
      expect(cell.className).toMatch(/dark:(from|to)-(green|blue|orange|red)-(800|950)/);
      expect(cell.className).toMatch(/dark:text-(green|blue|orange|red)-100/);
    }
  });

  it('ranks by a tier when one is chosen, and says so', () => {
    const onDifficultyChange = vi.fn();
    render(
      <CategoryMatrix
        data={data({ difficulty: 'EXTREME' })}
        search=""
        onSearchChange={vi.fn()}
        difficulty="EXTREME"
        onDifficultyChange={onDifficultyChange}
      />,
    );

    expect(screen.getByText(/Ranked by Extreme questions/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Extreme' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps every tier visible while ranking by one', () => {
    // Hiding the other three would answer a different question: "thin at the
    // top end" only means something against the tiers beside it.
    render(
      <CategoryMatrix
        data={data({ difficulty: 'EXTREME' })}
        search=""
        onSearchChange={vi.fn()}
        difficulty="EXTREME"
        onDifficultyChange={vi.fn()}
      />,
    );

    // The sorted column carries an arrow and a note for screen readers, so match
    // on the tier names rather than on exact header text.
    const headers = screen.getAllByRole('columnheader').map(h => h.textContent ?? '');
    for (const label of ['Easy', 'Normal', 'Hard', 'Extreme']) {
      expect(headers.some(text => text.includes(label))).toBe(true);
    }

    expect(headers).toHaveLength(7);
  });

  it('clears the ranking when the active tier is pressed again', () => {
    const onDifficultyChange = vi.fn();
    render(
      <CategoryMatrix
        data={data({ difficulty: 'HARD' })}
        search=""
        onSearchChange={vi.fn()}
        difficulty="HARD"
        onDifficultyChange={onDifficultyChange}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Hard' }));

    expect(onDifficultyChange).toHaveBeenCalledWith(null);
  });

  it('marks the sorted column in the grid, not only in the copy', () => {
    // Pressing a difficulty re-ordered the rows and left nothing in the table
    // to say which column caused it, so the new order looked arbitrary.
    const { container } = render(
      <CategoryMatrix
        data={data({ difficulty: 'HARD' })}
        search=""
        onSearchChange={vi.fn()}
        difficulty="HARD"
        onDifficultyChange={vi.fn()}
      />,
    );

    const sorted = container.querySelector('th[aria-sort="descending"]');

    expect(sorted).toHaveTextContent('Hard');

    // Every tile in that column is ringed too, so the eye can follow it down.
    const hardTiles = [...container.querySelectorAll('[data-difficulty="HARD"]')];

    expect(hardTiles.length).toBeGreaterThan(0);
    expect(hardTiles.every(tile => tile.className.includes('ring-primary/40'))).toBe(true);
  });

  it('lifts the colour on hover, not just the size', () => {
    // Scale alone reads as a rendering quirk; a brightness change reads as a
    // response to the pointer.
    const { container } = render(
      <CategoryMatrix data={data()} search="" onSearchChange={vi.fn()} difficulty={null} onDifficultyChange={vi.fn()} />,
    );

    const tile = container.querySelector('[data-difficulty]:not([data-empty])');

    expect(tile?.className).toContain('hover:brightness-125');
  });

  it('alternates the gradient direction along a row', () => {
    // Neighbours meet light against dark rather than repeating one direction,
    // which is what makes the seam legible without a border between tiles.
    const { container } = render(
      <CategoryMatrix data={data()} search="" onSearchChange={vi.fn()} difficulty={null} onDifficultyChange={vi.fn()} />,
    );
    const cells = [...container.querySelectorAll('[data-difficulty]:not([data-empty])')];

    // Darker step first on one, lighter step first on the next.
    expect(cells[0].className).toContain('from-green-300');
    expect(cells[1].className).toContain('from-blue-100');
  });

  it('shows growth as a signed figure, and a quiet week as a dash', () => {
    // A column of "+0" reads as a broken feed rather than a week nobody added
    // anything, and this column exists to answer "is this still being worked on".
    render(
      <CategoryMatrix
        data={data({
          category_matrix: {
            items: [
              { category: 'Growing', slug: 'g', total: 10, by_difficulty: [10, 0, 0, 0], added: 4 },
              { category: 'Static', slug: 's', total: 10, by_difficulty: [10, 0, 0, 0], added: 0 },
            ],
            total: 2,
            limit: 10,
          },
        })}
        search=""
        onSearchChange={vi.fn()}
        difficulty={null}
        onDifficultyChange={vi.fn()}
      />,
    );

    expect(screen.getByText('+4')).toBeInTheDocument();
    expect(screen.queryByText('+0')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Static: 0 added in this window')).toBeInTheDocument();
  });

  it('leaves air between the cells', () => {
    // Welded edge to edge they read as one solid block and the eye has to hunt
    // for the boundaries; this is enough to make each a box without breaking
    // the row into four separate things.
    const { container } = render(<CategoryMatrix data={data()} search="" onSearchChange={vi.fn()} difficulty={null} onDifficultyChange={vi.fn()} />);
    const table = container.querySelector('table') as HTMLElement;

    expect(table.className).toContain('border-spacing-x-1');
    expect(container.querySelector('[data-difficulty]')?.className).toContain('rounded-lg');
  });

  it('animates the cells in rather than blinking them', () => {
    const { container } = render(<CategoryMatrix data={data()} search="" onSearchChange={vi.fn()} difficulty={null} onDifficultyChange={vi.fn()} />);

    expect(container.querySelectorAll('.animate-data-rise').length).toBeGreaterThan(0);
  });

  it('says which search found nothing, rather than just "no data"', () => {
    render(
      <CategoryMatrix
        data={data({ search: 'zzz', category_matrix: { items: [], total: 0, limit: 10 } })}
        search="zzz"
        onSearchChange={vi.fn()}
        difficulty={null}
        onDifficultyChange={vi.fn()}
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
        difficulty={null}
        onDifficultyChange={vi.fn()}
      />,
    );

    // Three empty tiers, each an outlined dash rather than a shaded "0".
    const empty = container.querySelectorAll('[data-empty]');

    expect(empty).toHaveLength(3);
    expect([...empty].every(cell => cell.textContent === '—')).toBe(true);

    // `--tint` is what shades a real value; an empty cell carries none.
    for (const cell of empty) {
      expect(cell).not.toHaveAttribute('style');
    }
  });
});
