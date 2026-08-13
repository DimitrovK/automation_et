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
});
