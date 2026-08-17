import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NationFlag } from '@/components/analytics/NationFlag';

describe('nationFlag', () => {
  it('renders the flag against the API origin, lazily', () => {
    const { container } = render(<NationFlag flag="/media/nation_flags/italy-flag.png" />);

    const img = container.querySelector('img');

    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img?.getAttribute('src')).not.toBe('/media/nation_flags/italy-flag.png');
    expect(img?.getAttribute('src')).toContain('/media/nation_flags/italy-flag.png');
  });

  it('renders nothing at all when the nation has no flag', () => {
    // 230 of 233 nations have one, so this is rare — and an empty box held open
    // for the three that do not would be more visible than the gap it marks.
    const { container } = render(<NationFlag flag={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('is decorative — the nation name sits beside it', () => {
    const { container } = render(<NationFlag flag="/media/nation_flags/italy-flag.png" />);

    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });
});
