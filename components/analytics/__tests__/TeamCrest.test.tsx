import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TeamCrest } from '@/components/analytics/TeamCrest';

// Queried directly rather than through `getByRole('img')`: the badge is
// decorative and carries `alt=""`, which puts it under the `presentation` role.
// A `queryByRole('img')` assertion here would pass whether or not the image was
// rendered, which is worse than no assertion.
const badgeIn = (container: HTMLElement) => container.querySelector('img');

describe('teamCrest', () => {
  it('shows initials when there is no badge — the ordinary case', () => {
    // 377 of 4,455 teams carry a badge. The fallback is not an edge case, it is
    // what 91.5% of rows render, so it has to be a designed thing rather than a
    // gap where an image should be.
    const { container } = render(<TeamCrest name="Manchester United" badge={null} />);

    expect(screen.getByText('MU')).toBeInTheDocument();
    expect(badgeIn(container)).toBeNull();
  });

  it('takes initials from the first two words only', () => {
    render(<TeamCrest name="Borussia Vfl Mönchengladbach 1900" badge={null} />);

    expect(screen.getByText('BV')).toBeInTheDocument();
  });

  it('falls back to a single letter for a one-word name', () => {
    render(<TeamCrest name="Barcelona" badge={null} />);

    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('renders the badge when there is one, lazily and against the API origin', () => {
    const { container } = render(
      <TeamCrest name="Manchester United" badge="/media/team_badges/united.svg" />,
    );

    const img = badgeIn(container);

    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img?.getAttribute('src')).toContain('/media/team_badges/united.svg');
    // Resolved against the API origin, not left as a path on this app.
    expect(img?.getAttribute('src')).not.toBe('/media/team_badges/united.svg');
  });

  it('stays out of the accessibility tree — the name is already in the row', () => {
    // Decorative. Announcing "Manchester United crest" immediately before the
    // text "Manchester United" reads the club name twice to a screen reader.
    const { container } = render(
      <TeamCrest name="Manchester United" badge="/media/team_badges/united.svg" />,
    );

    expect(badgeIn(container)).toHaveAttribute('alt', '');
  });

  it('drops back to initials when the badge fails to load', () => {
    // A broken-image glyph repeated down a 4,400-row table is worse than no
    // image at all, and some of these files are old enough to point at nothing.
    const { container } = render(
      <TeamCrest name="Manchester United" badge="/media/team_badges/gone.svg" />,
    );

    fireEvent.error(badgeIn(container)!);

    expect(screen.getByText('MU')).toBeInTheDocument();
    expect(badgeIn(container)).toBeNull();
  });
});
