import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedValue } from '@/hooks/use-debounced-value';

describe('useDebouncedValue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns the initial value synchronously on first render', () => {
    const { result } = renderHook(() => useDebouncedValue('hello', 200));
    expect(result.current).toBe('hello');
  });

  it('updates only after the delay elapses', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 200),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'ab' });
    expect(result.current).toBe('a'); // not yet

    act(() => { vi.advanceTimersByTime(199); });
    expect(result.current).toBe('a');

    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current).toBe('ab');
  });

  it('resets the timer on rapid changes (only the last one settles)', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'a' } },
    );

    rerender({ value: 'ab' });
    act(() => { vi.advanceTimersByTime(150); });
    rerender({ value: 'abc' });
    act(() => { vi.advanceTimersByTime(150); });
    // Only 150ms after the latest change — still not settled.
    expect(result.current).toBe('a');

    act(() => { vi.advanceTimersByTime(150); });
    expect(result.current).toBe('abc');
  });
});
