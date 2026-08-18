import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IdentityTile } from '@/components/analytics/IdentityTile';

// Queried directly rather than through `getByRole('img')`: these images are
// decorative and carry `alt=""`, which puts them under the `presentation` role.
const imageIn = (container: HTMLElement) => container.querySelector('img');

describe('identityTile', () => {
  it('shows the image when there is one, lazily and against the API origin', () => {
    const { container } = render(
      <IdentityTile image="/media/team_badges/united.svg" fallback="MU" />,
    );

    const img = imageIn(container);

    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img?.getAttribute('src')).toContain('/media/team_badges/united.svg');
    expect(img?.getAttribute('src')).not.toBe('/media/team_badges/united.svg');
  });

  it('shows the fallback text when there is no image', () => {
    const { container } = render(<IdentityTile image={null} fallback="MU" />);

    expect(screen.getByText('MU')).toBeInTheDocument();
    expect(imageIn(container)).toBeNull();
  });

  it('falls back when the image fails to load', () => {
    // A broken-image glyph repeated down a table is worse than no image at all,
    // and some of these files are old enough to point at nothing.
    const { container } = render(
      <IdentityTile image="/media/team_badges/gone.svg" fallback="MU" />,
    );

    fireEvent.error(imageIn(container)!);

    expect(screen.getByText('MU')).toBeInTheDocument();
    expect(imageIn(container)).toBeNull();
  });

  it('stays out of the accessibility tree', () => {
    // Decorative. The name it stands for is rendered beside it in every caller,
    // so announcing it here reads the same thing twice.
    const { container } = render(
      <IdentityTile image="/media/team_badges/united.svg" fallback="MU" />,
    );

    expect(imageIn(container)).toHaveAttribute('alt', '');
  });
});
