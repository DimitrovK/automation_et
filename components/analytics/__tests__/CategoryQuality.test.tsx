import type { QuestionsAnalyticsResponse } from '@/types/reports';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CategoryQuality } from '@/components/analytics/panels/CategoryQuality';

function rows(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    category_id: index,
    name: `Cat${index}`,
    questions: 10,
    questions_answered: 10,
    answers: 100,
    // Ascending rate: the BE sends hardest first and this preserves that.
    correct_pct: 20 + index,
  }));
}

function data(count: number): QuestionsAnalyticsResponse {
  return {
    categories: { rows: rows(count), min_answers: 30, categories_measured: count },
  } as unknown as QuestionsAnalyticsResponse;
}

describe('categoryQuality', () => {
  it('shows ten rows and offers the rest', () => {
    render(<CategoryQuality data={data(40)} />);

    expect(screen.getAllByRole('row')).toHaveLength(11); // header + 10
    expect(screen.getByText('Showing 10 of 40')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show 30 more' })).toBeInTheDocument();
  });

  it('expands to the whole list', () => {
    render(<CategoryQuality data={data(40)} />);

    fireEvent.click(screen.getByRole('button', { name: 'Show 30 more' }));

    expect(screen.getAllByRole('row')).toHaveLength(41);
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
  });

  it('offers nothing to expand when the list already fits', () => {
    // "10 of 10" is noise.
    render(<CategoryQuality data={data(6)} />);

    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Show/ })).not.toBeInTheDocument();
  });

  it('keeps the hardest first, which is the point of the panel', () => {
    render(<CategoryQuality data={data(40)} />);

    const first = screen.getAllByRole('row')[1];

    expect(first).toHaveTextContent('Cat0');
    expect(first).toHaveTextContent('20%');
  });

  /** The filter is debounced, so a change only lands after the pause. */
  function type(value: string) {
    vi.useFakeTimers();
    try {
      fireEvent.change(screen.getByLabelText('Filter categories in this table'), {
        target: { value },
      });
      act(() => void vi.advanceTimersByTime(400));
    } finally {
      vi.useRealTimers();
    }
  }

  it('counts the FILTERED list, not the whole one', () => {
    // Offering "of 40" while a search is active would promise rows that are not
    // there.
    render(<CategoryQuality data={data(40)} />);

    type('Cat1');

    // Cat1 and Cat10..Cat19 — eleven matches, so ten shown and one more.
    expect(screen.getByText('Showing 10 of 11')).toBeInTheDocument();
  });

  it('says which search found nothing', () => {
    render(<CategoryQuality data={data(40)} />);

    type('zzz');

    expect(screen.getByText('No category matches "zzz".')).toBeInTheDocument();
  });
});
