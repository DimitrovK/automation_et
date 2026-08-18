'use client';

import { IdentityTile } from '@/components/analytics/IdentityTile';

/**
 * A nation's flag, falling back to its short code.
 *
 * The short code rather than initials, which is what `TeamCrest` uses: "ITA" is
 * already what this nation is called in every other column, while initialising
 * "Italy" would invent a second and worse name for it.
 *
 * The fallback is rare here — 230 of 233 active nations carry a flag — which is
 * the mirror image of teams, where the tile does almost all the work.
 */
export function NationCrest({ short, flag, className }: {
  short: string;
  flag: string | null | undefined;
  className?: string;
}) {
  return <IdentityTile image={flag} fallback={short} className={className} />;
}
