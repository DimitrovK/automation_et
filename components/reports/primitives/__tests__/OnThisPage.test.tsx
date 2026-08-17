import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OnThisPage } from '@/components/reports/primitives/OnThisPage';
import { SectionHeader } from '@/components/reports/primitives/SectionHeader';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { sectionId } from '@/lib/section-id';

afterEach(() => {
  document.body.innerHTML = '';
});

function withSections(titles: string[]) {
  return (
    <>
      <OnThisPage />
      {titles.map(title => (
        <SectionHeader key={title} title={title} description={`About ${title}`} />
      ))}
    </>
  );
}

describe('sectionId', () => {
  it('derives a stable anchor from the title', () => {
    expect(sectionId('Coverage where it is used')).toBe('section-coverage-where-it-is-used');
  });

  it('does not leave a trailing separator on punctuation', () => {
    expect(sectionId('Still playing, or retired?')).toBe('section-still-playing-or-retired');
  });
});

describe('onThisPage — card fallback', () => {
  it('lists card titles on a page with no sections', async () => {
    // Some pages were deliberately stripped of section headings. A jump list
    // that vanishes on the longest page is the wrong answer to that.
    render(
      <>
        <OnThisPage />
        <Card><CardHeader><CardTitle>Footballers by difficulty</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardTitle>Pictures by difficulty</CardTitle></CardHeader></Card>
      </>,
    );

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Pictures by difficulty' })).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: 'Footballers by difficulty' }))
      .toHaveAttribute('href', '#section-footballers-by-difficulty');
  });

  it('anchors on the card, not the title, so a jump clears the header', async () => {
    const { container } = render(
      <>
        <OnThisPage />
        <Card><CardHeader><CardTitle>One</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardTitle>Two</CardTitle></CardHeader></Card>
      </>,
    );

    await waitFor(() => expect(screen.getAllByRole('link')).toHaveLength(2));

    const target = container.querySelector('#section-one')!;

    expect(target).not.toHaveAttribute('data-card-title');
    expect(target.className).toContain('scroll-mt-');
  });

  it('prefers real sections when the page has them', async () => {
    // Cards are the fallback, not the default: a section groups several cards
    // and listing both levels would be the same page twice.
    render(
      <>
        <OnThisPage />
        <SectionHeader title="Alpha" />
        <SectionHeader title="Beta" />
        <Card><CardHeader><CardTitle>A card nobody asked to jump to</CardTitle></CardHeader></Card>
      </>,
    );

    await waitFor(() => expect(screen.getAllByRole('link')).toHaveLength(2));

    expect(screen.queryByRole('link', { name: /A card nobody/ })).not.toBeInTheDocument();
  });
});

describe('onThisPage', () => {
  it('discovers sections from the page rather than a declared list', async () => {
    // A hand-maintained list is a second copy of the page's structure, and the
    // copy rots — the global nav in this repo drifted for weeks that way.
    render(withSections(['The catalogue by difficulty', 'Coverage where it is used']));

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Coverage where it is used' })).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: 'The catalogue by difficulty' }))
      .toHaveAttribute('href', '#section-the-catalogue-by-difficulty');
  });

  it('links under the section\'s own heading, never a different name', async () => {
    render(withSections(['One', 'Two']));

    await waitFor(() => expect(screen.getAllByRole('link')).toHaveLength(2));
    for (const link of screen.getAllByRole('link')) {
      const target = document.getElementById(link.getAttribute('href')!.slice(1));

      expect(target).toHaveAttribute('data-section-title', link.textContent);
    }
  });

  it('stays out of the way on a page with one section', async () => {
    // One section is the page. The list earns its space from two.
    render(withSections(['Only one']));

    await waitFor(() => expect(screen.queryByRole('navigation')).not.toBeInTheDocument());
  });

  it('picks up sections that arrive after the first paint', async () => {
    // Panels load asynchronously: at first paint most sections are skeletons
    // and several do not exist yet.
    const { rerender } = render(withSections(['First']));
    await waitFor(() => expect(screen.queryByRole('navigation')).not.toBeInTheDocument());

    rerender(withSections(['First', 'Second']));

    await waitFor(() => {
      expect(screen.getByRole('navigation', { name: 'On this page' })).toBeInTheDocument();
    });

    expect(screen.getAllByRole('link')).toHaveLength(2);
  });

  it('survives an environment with no IntersectionObserver', async () => {
    // jsdom has none, and neither do older browsers. A missing observer should
    // cost the highlight, not the nav.
    const original = globalThis.IntersectionObserver;
    // @ts-expect-error deliberately removing it
    delete globalThis.IntersectionObserver;
    try {
      render(withSections(['A', 'B']));

      await waitFor(() => expect(screen.getAllByRole('link')).toHaveLength(2));

      expect(screen.queryByRole('link', { current: true })).not.toBeInTheDocument();
    } finally {
      globalThis.IntersectionObserver = original;
    }
  });

  it('stays put while the page scrolls', async () => {
    // A jump list that scrolls away is only useful once.
    render(withSections(['A', 'B']));

    await waitFor(() => expect(screen.getByRole('navigation')).toBeInTheDocument());

    expect(screen.getByRole('navigation')).toHaveClass('sticky');
  });

  it('offers the way back only once there is something to come back from', async () => {
    render(withSections(['A', 'B']));
    await waitFor(() => expect(screen.getByRole('navigation')).toBeInTheDocument());

    expect(screen.queryByRole('button', { name: 'Back to top' })).not.toBeInTheDocument();

    Object.defineProperty(window, 'scrollY', { value: 900, writable: true });
    window.dispatchEvent(new Event('scroll'));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Back to top' })).toBeInTheDocument();
    });
  });

  it('scrolls to the top when asked', async () => {
    const scrollTo = vi.fn();
    Object.defineProperty(window, 'scrollTo', { value: scrollTo, writable: true });
    Object.defineProperty(window, 'scrollY', { value: 900, writable: true });
    render(withSections(['A', 'B']));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Back to top' })).toBeInTheDocument());
    screen.getByRole('button', { name: 'Back to top' }).click();

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });
});
