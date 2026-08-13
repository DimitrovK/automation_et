import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ComparePicker } from '@/components/reports/ComparePicker';

describe('comparePicker', () => {
  it('clears a named period when an offset is chosen', () => {
    // The filter patch is merged, and an explicit period outranks the offset
    // everywhere downstream — so leaving it set makes this button do nothing
    // while looking selected. Silent, and only visible as "the picker is
    // broken".
    const onChange = vi.fn();
    render(
      <ComparePicker offset={1} start="2026-01-01" end="2026-01-31" onChange={onChange} />,
    );

    return userEvent.click(screen.getByRole('button', { name: '2 periods back' })).then(() => {
      // toStrictEqual, not toHaveBeenCalledWith: the latter treats a missing
      // key and an explicit `undefined` as equal, so it would pass against a
      // patch that never cleared anything — which is exactly the bug.
      expect(onChange.mock.calls[0][0]).toStrictEqual({
        compareOffset: 2,
        compareStart: undefined,
        compareEnd: undefined,
      });
    });
  });

  it('clears the named period from the clear button too', async () => {
    const onChange = vi.fn();
    render(
      <ComparePicker offset={3} start="2026-01-01" end="2026-01-31" onChange={onChange} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Clear the comparison period' }));

    expect(onChange.mock.calls[0][0]).toStrictEqual({
      compareOffset: 3,
      compareStart: undefined,
      compareEnd: undefined,
    });
  });

  it('gives the clear control a name and a tab stop', async () => {
    // It was an icon nested inside another button: no tab stop, no accessible
    // name, and invalid markup besides.
    render(<ComparePicker offset={1} start="2026-01-01" onChange={() => {}} />);
    const clear = screen.getByRole('button', { name: 'Clear the comparison period' });

    expect(clear.tagName).toBe('BUTTON');
    await userEvent.tab();
    expect(document.activeElement).not.toBeNull();
  });

  it('marks the chosen offset as selected, and not while a period is named', () => {
    const { rerender } = render(<ComparePicker offset={2} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: '2 periods back' }).className).toContain('bg-');

    // With a named period, no offset button should read as active — the
    // comparison isn't using any of them.
    rerender(<ComparePicker offset={2} start="2026-01-01" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /2026-01-01/ })).toBeTruthy();
  });
});
