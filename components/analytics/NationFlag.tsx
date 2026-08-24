'use client';

import { mediaUrl } from '@/lib/media-url';
import { cn } from '@/lib/utils';

/**
 * A nation's flag, beside the nation's name.
 *
 * The reliable half of a team's identity: 230 of 233 active nations carry a
 * flag against 8.5% of clubs carrying a crest, so this is what actually makes
 * a row recognisable at a glance.
 *
 * Nothing is rendered when there is no flag — no placeholder, no held-open box.
 * At three nations out of 233 a gap marker would draw more attention than the
 * gap deserves, and the name is right next to it either way.
 *
 * Plain `<img>` rather than `next/image`, as in `TeamCrest`: a staff-only
 * dashboard has nothing to gain from optimisation that would cost a
 * remote-pattern entry in `next.config.mjs` and per-image Vercel billing.
 */
export function NationFlag({ flag, className }: {
  flag: string | null | undefined;
  className?: string;
}) {
  const src = mediaUrl(flag);
  if (!src) {
    return null;
  }

  return (
    // eslint-disable-next-line next/no-img-element -- deliberate, see above
    <img
      src={src}
      // Decorative: the nation's name is rendered next to it by every caller.
      alt=""
      loading="lazy"
      className={cn('h-3 w-4.5 shrink-0 rounded-[2px] object-cover ring-1 ring-border/60 ring-inset', className)}
    />
  );
}
