import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RangePicker } from '@/components/reports/filters/RangePicker';

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

    expect(control).not.toBeChecked();
  });

  it('shows on when bots are actually included', () => {
    setup(true);

    expect(screen.getByRole('switch', { name: /include bots/i })).toBeChecked();
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

    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yesterday' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '1d' })).not.toBeInTheDocument();
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

  it('shows which range is selected, and only that one', () => {
    // The presets used to be seven separate outline buttons: nothing said
    // which was active, so the control answered "what am I looking at" with
    // silence. `aria-pressed` is the assertion because it is also what a
    // screen reader announces — a colour alone would say nothing to it.
    render(<RangePicker value={{ window: 30 }} onChange={() => {}} includeBots={false} onIncludeBotsChange={() => {}} />);

    expect(screen.getByRole('button', { name: '30d' })).toHaveAttribute('aria-pressed', 'true');

    const pressed = screen.getAllByRole('button').filter(b => b.getAttribute('aria-pressed') === 'true');

    expect(pressed).toHaveLength(1);
  });

  it('marks a custom range as selected rather than a preset', () => {
    render(
      <RangePicker
        value={{ window: 30, start: '2026-06-01', end: '2026-06-30' }}
        onChange={() => {}}
        includeBots={false}
        onIncludeBotsChange={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: /2026-06-01/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: '30d' })).toHaveAttribute('aria-pressed', 'false');
  });
});
