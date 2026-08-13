import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PlayStyleBadge } from '@/components/reports/PlayStyleBadge';

describe('playStyleBadge', () => {
  it('exposes the breakdown to assistive tech, not only on hover', () => {
    // `title` is a hover affordance: unreliable for screen readers, absent on
    // touch. The numbers behind the word have to be available, not merely
    // discoverable with a mouse.
    render(<PlayStyleBadge played={41} mp={35} />);
    const badge = screen.getByText('Mostly multiplayer');

    expect(badge.getAttribute('aria-label')).toBe('Mostly multiplayer: 35 multiplayer, 6 solo (85.4%)');
    expect(badge.getAttribute('title')).toBe(badge.getAttribute('aria-label'));
  });

  it('renders nothing when the backend has not sent a count', () => {
    // Absent is not zero: a badge reading "Solo" would claim we know.
    const { container } = render(<PlayStyleBadge played={41} />);

    expect(container.firstChild).toBeNull();
  });
});
