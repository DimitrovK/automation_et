import type { ReactNode } from 'react';
import { sectionId } from '@/lib/section-id';
import { cn } from '@/lib/utils';

/**
 * A heading for a group of panels inside a page.
 *
 * Pages have grown sections that are just a bare `<h2>` or, more often, nothing
 * at all — panels butt against each other and a reader has to infer where one
 * concern stops. `CardHeader` covers a single card; this is the level above it,
 * and it exists because folding pages together (R4) turned several one-topic
 * pages into several topics on one page.
 *
 * The description IS optional. It was required on the theory that a section
 * which cannot say what it is for in one line is really two — true, but it also
 * produced subtitles that restated the title, and four of those down a page is
 * furniture.
 */
export function SectionHeader({ title, description, actions, className }: {
  title: string;
  /**
   * Optional. Most sections say what they are in their title, and a subtitle
   * that only rephrases it is prose the reader has to skip on every visit. The
   * per-panel caveats moved to `InfoHint` for the same reason.
   */
  description?: string;
  /** Controls scoped to this section rather than the page. */
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      // The anchor and the label `OnThisPage` reads. Derived from the title
      // rather than passed in, so a section cannot appear in the jump list under
      // a name that differs from its own heading.
      id={sectionId(title)}
      data-section-title={title}
      className={cn(
        'flex flex-wrap items-end justify-between gap-3 pt-2',
        // Without this a jumped-to heading lands flush against the top of the
        // viewport, under any sticky chrome.
        'scroll-mt-20',
        className,
      )}
    >
      <div className="space-y-1">
        {/* Between the page title (text-2xl) and a card title (text-base), so a
            reader can tell a section from the panels inside it without reading
            either. */}
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
