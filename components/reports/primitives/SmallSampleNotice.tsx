import { cn } from '@/lib/utils';

/**
 * Why a number is missing, where the number would have been.
 *
 * Three surfaces already withhold figures below a threshold — retention rates
 * under 20 players, anomaly detection at low volume, and R2's time-to-second
 * session will make four — and each says so differently, or not at all. A blank
 * cell reads as "zero" or "broken"; both are worse than the truth, which is that
 * the sample is too small for the number to mean anything.
 *
 * It states the threshold rather than gesturing at it. "Too few players" invites
 * the reader to wonder how few; "under 20 players" ends the question, and makes
 * it obvious when a game will never clear the bar rather than leaving someone
 * checking back.
 */
export function SmallSampleNotice({ have, need, unit = 'players', className }: {
  /** How many there actually are. Shown, because "not enough" is not a number. */
  have: number;
  need: number;
  unit?: string;
  className?: string;
}) {
  return (
    <span
      className={cn('text-xs text-muted-foreground/70', className)}
      title={`Withheld below ${need} ${unit}: with ${have}, a single ${unit.replace(/s$/, '')} moves the figure enough to mislead.`}
    >
      {`— ${have} ${unit}, needs ${need}`}
    </span>
  );
}
