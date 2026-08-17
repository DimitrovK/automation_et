'use client';

import { useState } from 'react';
import { mediaUrl } from '@/lib/media-url';
import { cn } from '@/lib/utils';

/** The first letter of the first two words — "Manchester United" → "MU". */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0]?.toUpperCase() ?? '')
    .join('');
}

/**
 * A club's crest, or the tile that stands in for it.
 *
 * Built fallback-first on purpose. 377 of 4,455 approved teams carry a badge —
 * 8.5% — so the initials tile is what most of this table renders, and treating
 * it as the error path would leave nine rows in ten looking broken. The image
 * is the bonus layered on top, and it steps aside again if it fails to load:
 * a column of broken-image glyphs is worse than a column of tidy monograms.
 *
 * Plain `<img>` rather than `next/image`. This is a staff-only dashboard, so
 * there is nothing to gain from optimisation that would justify a remote-pattern
 * entry in `next.config.mjs` and per-image Vercel billing.
 */
export function TeamCrest({ name, badge, className }: {
  name: string;
  /** Path or URL from the API. Null for most teams. */
  badge: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = failed ? null : mediaUrl(badge);

  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md',
        'bg-muted text-[0.65rem] font-semibold text-muted-foreground ring-1 ring-inset ring-border',
        className,
      )}
    >
      {src
        ? (
            // eslint-disable-next-line next/no-img-element -- deliberate, see above
            <img
              src={src}
              // Decorative: the club name sits next to it in every caller, and
              // an alt here would have a screen reader say it twice.
              alt=""
              loading="lazy"
              className="size-full object-contain"
              onError={() => setFailed(true)}
            />
          )
        : (
            <span aria-hidden>{initials(name)}</span>
          )}
    </span>
  );
}
