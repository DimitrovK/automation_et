'use client';

import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { sectionId } from '@/lib/section-id';
import { cn } from '@/lib/utils';

/**
 * Jump links for the sections on this page, and a way back up.
 *
 * These pages have grown: the footballers page is five sections and the
 * questions page four, each several hundred pixels tall. Finding the one you
 * came for means scrolling past the rest, and getting back to the filters means
 * scrolling all the way up again.
 *
 * Sections are DISCOVERED from the DOM rather than declared per page. A
 * hand-maintained list is a second copy of the page's structure, and the copy
 * rots — the global nav in this repo had drifted from the section navs for weeks
 * for exactly that reason. `SectionHeader` stamps its own id and title, so a
 * section added anywhere appears here for free and cannot appear under a
 * different name than its heading.
 *
 * Re-scans on mutation, because panels arrive asynchronously: at first paint
 * most sections are still skeletons and several do not exist yet.
 */
export function OnThisPage({ className }: { className?: string }) {
  const [sections, setSections] = useState<{ id: string; title: string }[]>([]);
  const [showTop, setShowTop] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const scan = () => {
      const sectionEls = [...document.querySelectorAll('[data-section-title]')];

      // Sections when the page has them; card titles when it does not. Some
      // pages were deliberately stripped of section headings, and a jump list
      // that disappears on the longest page is the wrong answer to that.
      const found = sectionEls.length >= 2
        ? sectionEls.map(el => ({
            id: el.id,
            title: el.getAttribute('data-section-title') ?? '',
          }))
        : [...document.querySelectorAll('[data-card-title]')]
            .map((el) => {
              const title = (el.textContent ?? '').trim();
              // Anchored on the CARD rather than the title, so a jump lands
              // above the card edge instead of mid-header. Setting an attribute
              // does not retrigger the observer, which watches childList only.
              const anchor = el.closest('.rounded-lg') ?? el;
              if (!anchor.id) {
                anchor.id = sectionId(title);
                anchor.classList.add('scroll-mt-20');
              }
              return { id: anchor.id, title };
            })
            .filter(entry => entry.title.length > 0 && entry.title.length < 60);
      // Only update on a real change: setting state on every mutation would
      // re-render this component into the mutation that triggered it.
      setSections(prev =>
        prev.length === found.length && prev.every((s, i) => s.id === found[i].id) ? prev : found,
      );
    };

    // Scanned after a frame rather than synchronously: this component renders
    // BEFORE the sections it describes (it sits above them in the shell), so a
    // synchronous first pass always finds nothing. It also keeps the state
    // update out of the effect body, which
    // `react-hooks-extra/no-direct-set-state-in-use-effect` rightly objects to.
    const frame = requestAnimationFrame(scan);
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    // Which section you are actually in, so the bar reports position rather than
    // just offering destinations. Feature-detected: this runs in jsdom under
    // test and in older browsers, and a missing observer should cost the
    // highlight, not the nav.
    if (sections.length < 2 || typeof IntersectionObserver === 'undefined') {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        // The topmost heading currently past the trigger line wins. Taking the
        // last entry instead makes the highlight jump backwards when two
        // headings are on screen together.
        const visible = entries.filter(entry => entry.isIntersecting);
        if (visible.length > 0) {
          setActive(visible[0].target.id);
        }
      },
      // A band near the top: a heading counts as "current" from when it reaches
      // the chrome until the next one does.
      { rootMargin: '-72px 0px -70% 0px', threshold: 0 },
    );
    for (const section of sections) {
      const el = document.getElementById(section.id);
      if (el) {
        observer.observe(el);
      }
    }
    return () => observer.disconnect();
  }, [sections]);

  useEffect(() => {
    // One viewport down is the point where "back to top" stops being obvious.
    const onScroll = () => setShowTop(window.scrollY > 600);
    // Same reason as above: read the initial position in a callback, not in the
    // effect body. A page restored mid-scroll still gets the button.
    const frame = requestAnimationFrame(onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // One section is the page. The jump list earns its space from two.
  if (sections.length < 2) {
    return null;
  }

  return (
    <>
      {/* Sticky, because a jump list that scrolls away is only useful once.
          `backdrop-blur` rather than a solid fill so the content it covers stays
          faintly visible and the bar reads as chrome rather than as a panel. */}
      <nav
        aria-label="On this page"
        className={cn(
          'sticky top-0 z-30 -mx-1 flex flex-wrap items-center gap-1.5 rounded-lg border border-border/60',
          'bg-background/85 px-2 py-1.5 text-xs backdrop-blur supports-backdrop-filter:bg-background/70',
          className,
        )}
      >
        <span className="mr-1 shrink-0 font-medium text-muted-foreground">On this page</span>
        {sections.map((section) => {
          const isActive = active === section.id;
          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              aria-current={isActive ? 'true' : undefined}
              className={cn(
                'rounded-md px-2 py-1 font-medium ring-1 transition-colors ring-inset',
                isActive
                  ? 'bg-primary/10 text-foreground ring-primary/40'
                  : 'text-muted-foreground ring-border hover:bg-muted hover:text-foreground',
              )}
            >
              {section.title}
            </a>
          );
        })}
      </nav>

      {/* Fixed rather than sticky inside the nav: it has to be reachable from
          the bottom of a very long page, which is the only place it is wanted. */}
      {showTop && (
        <Button
          type="button"
          size="icon"
          variant="secondary"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed right-6 bottom-6 z-50 size-10 rounded-full shadow-lg"
        >
          <ArrowUp className="size-4" />
        </Button>
      )}
    </>
  );
}
