'use client';

import { useState } from 'react';
import { mediaUrl } from '@/lib/media-url';
import { cn } from '@/lib/utils';

/**
 * A small square standing for a team or a nation: its image, or some text.
 *
 * Both callers need the same three things — resolve the path against the API,
 * load it lazily, and step aside for text when it is absent or broken — and
 * they disagree only about what the text is. What differs between them is which
 * case is normal: 8.5% of clubs carry a crest against 99% of nations carrying a
 * flag, so for teams the text is the usual outcome and for nations it is the
 * exception. Neither is treated as an error path here.
 *
 * Plain `<img>` rather than `next/image`: a staff-only dashboard has nothing to
 * gain from optimisation that would cost a remote-pattern entry in
 * `next.config.mjs` and per-image Vercel billing.
 */
export function IdentityTile({ image, fallback, className }: {
  /** Path or URL from the API, or null when there is none. */
  image: string | null | undefined;
  /** Shown when there is no image, or when it fails to load. */
  fallback: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const src = failed ? null : mediaUrl(image);

  return (
    <span
      className={cn(
        'flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md',
        'bg-muted text-[0.65rem] font-semibold text-muted-foreground ring-1 ring-border ring-inset',
        className,
      )}
    >
      {src
        ? (
            // eslint-disable-next-line next/no-img-element -- deliberate, see above
            <img
              src={src}
              // Decorative: the name it stands for is beside it in every caller.
              alt=""
              loading="lazy"
              className="size-full object-contain"
              onError={() => setFailed(true)}
            />
          )
        : (
            <span aria-hidden>{fallback}</span>
          )}
    </span>
  );
}
