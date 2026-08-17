/**
 * The colours data wears on this surface, in one place.
 *
 * These were previously invented per panel, and the panels disagreed: the
 * category matrix gave difficulty an ordinal ramp while the two difficulty bar
 * panels rendered every tier in the same emerald gradient — so "Hard" was one
 * colour in a table and another below it, and "Extreme" was indistinguishable
 * from "Easy" in both bar panels.
 *
 * Two vocabularies, because they answer different questions:
 *
 * DIFFICULTY is ORDINAL — four points on one scale — so it runs cool to hot.
 * Not four categorical hues, which would claim they are four unrelated kinds of
 * thing, and not a single-hue lightness ramp, which loses to the surface tint
 * at the pale end.
 *
 * CAREER STATE is a two-way split of a whole, so it takes two hues that read as
 * "here" and "gone" rather than as a scale.
 *
 * Both carry a Tailwind class (for bars and chips, which live in the class
 * layer) and a hex (for recharts, which writes colours into SVG presentation
 * attributes where `var()` is not reliable). The two must name the same colour:
 * a bar and the chart above it describing the same thing in different colours
 * is worse than either choice alone.
 */
export type DataTier = {
  label: string;
  /** Fill for a bar. A gradient along the bar's length, not across it. */
  bar: string;
  /** The bar's own rail, in its own hue. A neutral grey rail reads as chrome. */
  track: string;
  /**
   * A matrix cell: dark at one end of the gradient, the hue at the other.
   *
   * THEME-AWARE, and that is the point of this shape.
   *
   * A dark tile on a light page is a hole punched in it — the earlier
   * slate-to-hue version was legible but belonged to a dark background and sat
   * on both. So light mode runs 300 to 100 with the number in the hue's 900,
   * and dark mode runs 950 to 800 with the number in its 100. Each theme keeps
   * the tile a shade OF its own surface rather than a block dropped onto it.
   *
   * Muted either way: the fill is two adjacent steps, so the gradient reads as
   * depth rather than as a second colour, and the number stays the darkest (or
   * lightest) thing in the tile. Colour identifies the column; the number is
   * the content.
   *
   * `chip` runs slate to hue, `chipAlt` runs hue to slate, and the matrix
   * alternates them across a row. Neighbouring cells meet light-against-dark
   * rather than repeating one direction, which gives the band a rhythm instead
   * of four identical tiles.
   *
   * The saturated version read as shouting — four blocks of full-strength
   * colour side by side, competing with the numbers they were meant to carry.
   * The colour only has to say which difficulty this is; the number is the
   * content, so the fill steps back and the text does the identifying.
   *
   * A real light shade, not an opacity of a dark one. That distinction is the
   * whole reason the earlier tinted version disappeared.
   *
   * The fill sits at 50-100 with a 200 ring — enough hue to identify the
   * column at a glance, not enough for four in a row to compete with the
   * numbers they carry. The TEXT stays at 700 rather than dropping to 400-500
   * with everything else: on a fill this pale those shades fall under the
   * contrast floor, and an unreadable number is the one thing this table
   * cannot afford.
   *
   * TO DIAL IT FURTHER, this line is the only knob — raise the fill toward 200
   * for more colour, or drop the ring to 100 for less.
   */
  chip: string;
  /** The same fill with the gradient reversed. Alternated along a row. */
  chipAlt: string;
  /** Text colour for a column header. */
  head: string;
  /** Solid dot carrying the colour into a legend or header. */
  dot: string;
  /** The same colour for recharts. Tailwind 500-weight. */
  hex: string;
};

/**
 * Green, blue, orange, red.
 *
 * The previous version tinted each cell by its share of the row, floored at
 * 12% opacity — which meant a genuine value could render at a twelfth of its
 * colour and simply not be visible, worst of all in amber. Encoding magnitude
 * in the fill was not worth a table you cannot read: the number is already
 * printed in the box, so the colour's only job is to say which difficulty this
 * is, and it does that best at full strength.
 */
export const DIFFICULTY_TIERS: Record<string, DataTier> = {
  EASY: {
    label: 'Easy',
    bar: 'bg-gradient-to-r from-green-400 to-green-500',
    track: 'bg-green-400/20',
    chip: 'from-green-300 to-green-100 text-green-900 ring-1 ring-inset ring-green-400/40 dark:from-green-950 dark:to-green-800 dark:text-green-100 dark:ring-green-700/50',
    chipAlt: 'from-green-100 to-green-300 text-green-900 ring-1 ring-inset ring-green-400/40 dark:from-green-800 dark:to-green-950 dark:text-green-100 dark:ring-green-700/50',
    head: 'text-green-600 dark:text-green-400',
    dot: 'bg-green-400',
    hex: '#22c55e',
  },
  NORMAL: {
    label: 'Normal',
    bar: 'bg-gradient-to-r from-blue-400 to-blue-500',
    track: 'bg-blue-400/20',
    chip: 'from-blue-300 to-blue-100 text-blue-900 ring-1 ring-inset ring-blue-400/40 dark:from-blue-950 dark:to-blue-800 dark:text-blue-100 dark:ring-blue-700/50',
    chipAlt: 'from-blue-100 to-blue-300 text-blue-900 ring-1 ring-inset ring-blue-400/40 dark:from-blue-800 dark:to-blue-950 dark:text-blue-100 dark:ring-blue-700/50',
    head: 'text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-400',
    hex: '#3b82f6',
  },
  HARD: {
    label: 'Hard',
    bar: 'bg-gradient-to-r from-orange-400 to-orange-500',
    track: 'bg-orange-400/20',
    chip: 'from-orange-300 to-orange-100 text-orange-900 ring-1 ring-inset ring-orange-400/40 dark:from-orange-950 dark:to-orange-800 dark:text-orange-100 dark:ring-orange-700/50',
    chipAlt: 'from-orange-100 to-orange-300 text-orange-900 ring-1 ring-inset ring-orange-400/40 dark:from-orange-800 dark:to-orange-950 dark:text-orange-100 dark:ring-orange-700/50',
    head: 'text-orange-600 dark:text-orange-400',
    dot: 'bg-orange-400',
    hex: '#f97316',
  },
  EXTREME: {
    label: 'Extreme',
    bar: 'bg-gradient-to-r from-red-400 to-red-500',
    track: 'bg-red-400/20',
    chip: 'from-red-300 to-red-100 text-red-900 ring-1 ring-inset ring-red-400/40 dark:from-red-950 dark:to-red-800 dark:text-red-100 dark:ring-red-700/50',
    chipAlt: 'from-red-100 to-red-300 text-red-900 ring-1 ring-inset ring-red-400/40 dark:from-red-800 dark:to-red-950 dark:text-red-100 dark:ring-red-700/50',
    head: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-400',
    hex: '#ef4444',
  },
};

/** An unknown tier still renders, in a colour that claims nothing. */
const UNKNOWN_TIER: DataTier = {
  label: '',
  bar: 'bg-muted-foreground/40',
  track: 'bg-muted-foreground/10',
  chipAlt: 'bg-muted text-foreground',
  chip: 'bg-muted text-foreground',
  head: 'text-muted-foreground',
  dot: 'bg-muted-foreground',
  hex: '#94a3b8',
};

export function difficultyTier(difficulty: string): DataTier {
  return DIFFICULTY_TIERS[difficulty] ?? { ...UNKNOWN_TIER, label: difficulty };
}

/** Still playing against retired: two states of a whole, not a scale. */
export const CAREER_STATE = {
  active: { label: 'Still playing', bar: 'bg-gradient-to-r from-teal-400 to-teal-500', track: 'bg-teal-400/20', hex: '#2dd4bf' },
  // Deliberately not grey: at bar heights a neutral reads as "no data" rather
  // than as a value, and this is half the catalogue.
  retired: { label: 'Retired', bar: 'bg-gradient-to-r from-violet-400 to-violet-500', track: 'bg-violet-400/20', hex: '#a78bfa' },
} as const;

/**
 * Magnitude with no category behind it — squad size, row counts.
 *
 * One colour, deliberately: shading these by value would imply a threshold
 * ("amber means concerning") that a squad size does not have.
 */
export const MAGNITUDE_BAR = 'bg-gradient-to-r from-primary/55 to-primary/80';
export const MAGNITUDE_TRACK = 'bg-primary/10';
