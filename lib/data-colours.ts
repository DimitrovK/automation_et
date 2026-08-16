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
  /** Fill for a bar or chip. */
  bar: string;
  /** Solid background for a matrix cell, with text that contrasts against it. */
  chip: string;
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
    bar: 'bg-green-500',
    chip: 'bg-green-600 text-white dark:bg-green-500 dark:text-green-950',
    head: 'text-green-700 dark:text-green-400',
    dot: 'bg-green-500',
    hex: '#22c55e',
  },
  NORMAL: {
    label: 'Normal',
    bar: 'bg-blue-500',
    chip: 'bg-blue-600 text-white dark:bg-blue-500 dark:text-blue-950',
    head: 'text-blue-700 dark:text-blue-400',
    dot: 'bg-blue-500',
    hex: '#3b82f6',
  },
  HARD: {
    label: 'Hard',
    bar: 'bg-orange-500',
    chip: 'bg-orange-600 text-white dark:bg-orange-500 dark:text-orange-950',
    head: 'text-orange-700 dark:text-orange-400',
    dot: 'bg-orange-500',
    hex: '#f97316',
  },
  EXTREME: {
    label: 'Extreme',
    bar: 'bg-red-500',
    chip: 'bg-red-600 text-white dark:bg-red-500 dark:text-red-950',
    head: 'text-red-700 dark:text-red-400',
    dot: 'bg-red-500',
    hex: '#ef4444',
  },
};

/** An unknown tier still renders, in a colour that claims nothing. */
const UNKNOWN_TIER: DataTier = {
  label: '',
  bar: 'bg-muted-foreground/40',
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
  active: { label: 'Still playing', bar: 'bg-teal-500', hex: '#14b8a6' },
  // Deliberately not grey: at bar heights a neutral reads as "no data" rather
  // than as a value, and this is half the catalogue.
  retired: { label: 'Retired', bar: 'bg-violet-500', hex: '#8b5cf6' },
} as const;

/**
 * Magnitude with no category behind it — squad size, row counts.
 *
 * One colour, deliberately: shading these by value would imply a threshold
 * ("amber means concerning") that a squad size does not have.
 */
export const MAGNITUDE_BAR = 'bg-primary';
