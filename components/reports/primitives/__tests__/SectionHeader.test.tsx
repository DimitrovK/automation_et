import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SectionHeader } from '@/components/reports/primitives/SectionHeader';

describe('sectionHeader', () => {
  it('renders no paragraph at all without a description', () => {
    // Not an empty one: it still takes its line height and margin, so the
    // heading sits oddly high above the panels for no visible reason.
    const { container } = render(<SectionHeader title="The catalogue by difficulty" />);

    expect(screen.getByRole('heading', { name: 'The catalogue by difficulty' })).toBeInTheDocument();
    expect(container.querySelector('p')).toBeNull();
  });

  it('renders the description when there is one', () => {
    render(<SectionHeader title="Coverage" description="What the games cannot use." />);

    expect(screen.getByText('What the games cannot use.')).toBeInTheDocument();
  });

  it('anchors itself so the jump nav can find and name it', () => {
    const { container } = render(<SectionHeader title="Still playing, or retired" />);
    const root = container.firstElementChild!;

    expect(root.id).toBe('section-still-playing-or-retired');
    expect(root).toHaveAttribute('data-section-title', 'Still playing, or retired');
    // Without this a jumped-to heading lands under the sticky chrome.
    expect(root.className).toContain('scroll-mt-');
  });
});
