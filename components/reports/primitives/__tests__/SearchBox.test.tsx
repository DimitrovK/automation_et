import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchBox } from '@/components/reports/filters/SearchBox';

describe('searchBox', () => {
  beforeEach(() => vi.useFakeTimers());

  afterEach(() => vi.useRealTimers());

  it('waits for a pause before querying', () => {
    // Every change is a server round trip. Without the debounce, "england" is
    // seven requests whose answers can arrive out of order.
    const onChange = vi.fn();
    render(<SearchBox value="" onChange={onChange} placeholder="Filter" />);

    fireEvent.change(screen.getByPlaceholderText('Filter'), { target: { value: 'eng' } });

    expect(onChange).not.toHaveBeenCalled();

    act(() => void vi.advanceTimersByTime(300));

    expect(onChange).toHaveBeenCalledWith('eng');
  });

  it('sends one query for a burst of typing, not one per key', () => {
    const onChange = vi.fn();
    render(<SearchBox value="" onChange={onChange} placeholder="Filter" />);
    const input = screen.getByPlaceholderText('Filter');

    for (const text of ['e', 'en', 'eng', 'engl']) {
      fireEvent.change(input, { target: { value: text } });
      act(() => void vi.advanceTimersByTime(100));
    }
    act(() => void vi.advanceTimersByTime(300));

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('engl');
  });

  it('clears back to everything', () => {
    const onChange = vi.fn();
    render(<SearchBox value="eng" onChange={onChange} placeholder="Filter" />);

    fireEvent.click(screen.getByLabelText('Clear search'));
    act(() => void vi.advanceTimersByTime(300));

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('does not re-fire when the committed value arrives back', () => {
    // The parent echoes the value back as a prop. Treating that as a change
    // would query again for the same string, forever.
    const onChange = vi.fn();
    const { rerender } = render(<SearchBox value="" onChange={onChange} placeholder="Filter" />);

    fireEvent.change(screen.getByPlaceholderText('Filter'), { target: { value: 'eng' } });
    act(() => void vi.advanceTimersByTime(300));
    rerender(<SearchBox value="eng" onChange={onChange} placeholder="Filter" />);
    act(() => void vi.advanceTimersByTime(600));

    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
