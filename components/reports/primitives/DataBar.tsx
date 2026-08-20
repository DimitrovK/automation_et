import { cn } from '@/lib/utils';

/**
 * One value as a horizontal bar.
 *
 * Replaces `ui/progress` everywhere a bar carries DATA rather than completion.
 * That component is a loading indicator and behaves like one: `h-4` of chunky
 * track, `rounded-full` at both ends so the bar floats free of its own
 * baseline, an opaque `bg-muted` rail that reads as "percent complete", and a
 * hardcoded emerald gradient. Four different measurements — difficulty mix,
 * picture coverage, career state, squad size — all arrived as the same emerald,
 * which is a bar that encodes nothing.
 *
 * The differences here are the whole point:
 *
 * THIN, BUT NOT INVISIBLE. 10px against 16. The first attempt at this went to
 * 6px with a 6%-opacity track, which is thin enough that the bar stops reading
 * as a bar — "read by length" still needs something to see.
 *
 * SQUARE AT THE BASELINE, rounded only at the data end. Every bar starts on the
 * same line, so lengths compare; a rounded start pulls the eye off that line
 * and shortens short bars visually more than long ones.
 *
 * NO GRADIENT. A gradient makes the same value look different at different
 * lengths, and it is the single thing that dates a chart most.
 *
 * A HAIRLINE TRACK, not a filled rail — present enough to show the full extent,
 * quiet enough that the data is the dark thing on the page.
 */
export function DataBar({ value, max, colour, track, label, minPct = 0, className }: {
  value: number;
  /** What a full bar means. Bars sharing a max are comparable; that is the point. */
  max: number;
  /** Tailwind background class from `lib/data-colours`, never an ad-hoc hue. */
  colour: string;
  /**
   * The rail, in the bar's own hue. A neutral grey rail reads as chrome — part
   * of the component rather than part of the measurement — and at low contrast
   * it is the only thing visible when the fill fails to render.
   */
  track?: string;
  /** Read to anyone who cannot see the bar. The number alone is not a sentence. */
  label: string;
  /**
   * Floor for a NON-ZERO value, so the smallest row is still a bar.
   *
   * Off by default, because a floor is a small lie about length and most bars
   * do not need one. It earns its place where the range is wide enough that the
   * tail rounds to nothing: career-path modes run 7,854 against 29, so the last
   * row draws at 0.4% of the track — no pixels at all, which reads as zero
   * rather than as few. Only ever applied when the value is genuinely above
   * zero, and only where the real number is printed beside the bar.
   */
  minPct?: number;
  className?: string;
}) {
  // Clamped rather than trusted: one bad row should not render a bar through
  // the side of the card, and a negative width silently disappears.
  const raw = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  // Zero keeps an empty track. Lifting it to the floor too would draw a bar for
  // a mode nobody played, which is the one thing the floor must not do.
  const pct = value > 0 ? Math.max(raw, minPct) : raw;

  return (
    <div
      role="img"
      aria-label={label}
      className={cn('h-3 w-full overflow-hidden rounded-full', track ?? 'bg-foreground/[0.09]', className)}
    >
      <div
        // Rounded on the data end only. `rounded-r-[3px]` with a square left
        // edge is what anchors it to the baseline.
        className={cn('h-full rounded-full animate-data-grow shadow-sm transition-[width] duration-500 ease-out', colour)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
