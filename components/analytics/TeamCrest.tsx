'use client';

import { IdentityTile } from '@/components/analytics/IdentityTile';

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
 * A club's crest, or the monogram that stands in for it.
 *
 * The monogram is the usual outcome: 377 of 4,455 approved teams carry a badge,
 * so nine rows in ten render initials and treating that as the error path would
 * leave most of the table looking broken. The crest is the bonus on top.
 *
 * Initials rather than a short code, which is what `NationCrest` falls back to —
 * teams have no short code, and their names are long enough that two letters is
 * the only thing that fits.
 */
export function TeamCrest({ name, badge, className }: {
  name: string;
  /** Path or URL from the API. Null for most teams. */
  badge: string | null;
  className?: string;
}) {
  return <IdentityTile image={badge} fallback={initials(name)} className={className} />;
}
