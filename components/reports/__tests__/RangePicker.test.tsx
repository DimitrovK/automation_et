import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RangePicker } from '@/components/reports/RangePicker';

function setup(includeBots = false) {
  const onIncludeBotsChange = vi.fn();
  render(
    <RangePicker
      value={{ window: 30 }}
      onChange={() => {}}
      includeBots={includeBots}
      onIncludeBotsChange={onIncludeBotsChange}
    />,
  );
  return { onIncludeBotsChange };
}

describe('bots control', () => {
  it('reads as state, not as an instruction', () => {
    // The bug: it was a Button labelled "Bots excluded". Button labels read as
    // actions, so an unfilled "Bots excluded" read as "click to exclude bots" —
    // implying they currently weren't. A switch has an unambiguous off state.
    setup(false);

    const control = screen.getByRole('switch', { name: /include bots/i });
    expect(control.getAttribute('aria-checked')).toBe('false');
  });

  it('shows on when bots are actually included', () => {
    setup(true);

    expect(screen.getByRole('switch', { name: /include bots/i }).getAttribute('aria-checked')).toBe('true');
  });

  it('does not present itself as a selected filter beside the window presets', () => {
    // It used to be a Button in the same row as the 7/30/90 presets, where
    // filled genuinely means "selected" — so it competed with them.
    setup(false);

    const buttons = screen.getAllByRole('button').map(b => b.textContent);
    expect(buttons.some(label => /bots/i.test(label ?? ''))).toBe(false);
  });

  it('toggles', async () => {
    const { onIncludeBotsChange } = setup(false);

    await userEvent.click(screen.getByRole('switch', { name: /include bots/i }));

    expect(onIncludeBotsChange).toHaveBeenCalledWith(true);
  });

  it('offers today and yesterday by name, and only once', () => {
    // "1d" beside a "Today" button would be the same range under two names.
    render(<RangePicker value={{ window: 30 }} onChange={() => {}} includeBots={false} onIncludeBotsChange={() => {}} />);

    expect(screen.getByRole('button', { name: 'Today' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Yesterday' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: '1d' })).toBeNull();
  });

  it('asks for a one-day window when Today is picked', async () => {
    const onChange = vi.fn();
    render(<RangePicker value={{ window: 30 }} onChange={onChange} includeBots={false} onIncludeBotsChange={() => {}} />);

    await userEvent.click(screen.getByRole('button', { name: 'Today' }));

    expect(onChange).toHaveBeenCalledWith({ window: 1 });
  });

  it('asks for explicit dates when Yesterday is picked', async () => {
    // A window counts back from today, so yesterday has to be dates.
    const onChange = vi.fn();
    render(<RangePicker value={{ window: 30 }} onChange={onChange} includeBots={false} onIncludeBotsChange={() => {}} />);

    await userEvent.click(screen.getByRole('button', { name: 'Yesterday' }));

    const arg = onChange.mock.calls[0][0];
    expect(arg.start).toBe(arg.end);
    expect(arg.start).not.toBeUndefined();
    // The previous preset survives, so clearing the range returns to it.
    expect(arg.window).toBe(30);
  });
});
