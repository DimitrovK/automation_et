import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NationCrest } from '@/components/analytics/NationCrest';

const imageIn = (container: HTMLElement) => container.querySelector('img');

describe('nationCrest', () => {
  it('shows the flag, which is the usual case here', () => {
    // The mirror of TeamCrest: 230 of 233 nations carry a flag against 8.5% of
    // clubs carrying a crest, so for nations the image is the normal path.
    const { container } = render(
      <NationCrest short="ITA" flag="/media/nation_flags/italy-flag.png" />,
    );

    expect(imageIn(container)?.getAttribute('src')).toContain('italy-flag.png');
    expect(screen.queryByText('ITA')).not.toBeInTheDocument();
  });

  it('falls back to the short code, not to initials', () => {
    // "ITA" is what a nation is already called in every other column, and
    // initialising "Italy" to "I" would invent a second, worse name for it.
    const { container } = render(<NationCrest short="ITA" flag={null} />);

    expect(screen.getByText('ITA')).toBeInTheDocument();
    expect(imageIn(container)).toBeNull();
  });

  it('drops back to the short code when the flag fails to load', () => {
    const { container } = render(
      <NationCrest short="ITA" flag="/media/nation_flags/gone.png" />,
    );

    fireEvent.error(imageIn(container)!);

    expect(screen.getByText('ITA')).toBeInTheDocument();
  });
});
