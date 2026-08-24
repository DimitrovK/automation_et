'use client';

import { playStyle } from '@/lib/play-style';
import { cn } from '@/lib/utils';

/**
 * Whether a player's sessions were solo or against other people.
 *
 * A word rather than a percentage: "63% multiplayer" is a number still waiting
 * to be interpreted, and a column of them is a column of arithmetic. The exact
 * figure is in the tooltip and the CSV for anyone who wants it.
 *
 * Renders nothing when the backend hasn't sent the count — a dash would read as
 * "we know, and it's none", which is a different claim from "we don't know".
 */
export function PlayStyleBadge({ played, mp }: { played: number; mp?: number }) {
  const style = playStyle(played, mp);
  if (!style) {
    return null;
  }

  // Multiplayer earns the accent; solo is the ordinary case and stays quiet.
  // A palette per band would make five colours out of one fact.
  const emphasised = style.label === 'Multiplayer' || style.label === 'Mostly multiplayer';

  // `title` is a hover affordance: unreliable for screen readers and absent on
  // touch. The same sentence goes in aria-label so the numbers behind the word
  // are available rather than merely discoverable with a mouse.
  const breakdown = `${style.label}: ${style.mp.toLocaleString()} multiplayer, ${style.solo.toLocaleString()} solo (${style.mpPct}%)`;

  return (
    <span
      title={breakdown}
      aria-label={breakdown}
      className={cn(
        'inline-block rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        emphasised
          ? 'bg-primary/10 text-primary'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {style.label}
    </span>
  );
}
