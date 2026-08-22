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
   * and dark mode runs near-black slate to the hue's 500 with WHITE text: the
   * hue's own 100 was fine against an 800 but too close to a 500 to read. A dark
   * tile that
   * arrives at real colour, rather than a uniformly deep one. Two earlier
   * attempts failed the other ways: 950-to-800 was so dark the four hues stopped
   * being tellable apart, and a full-strength gradient shouted over the numbers.
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
    chip: 'bg-green-100 text-green-900 ring-1 ring-inset ring-green-300 dark:bg-green-900 dark:text-green-100 dark:ring-green-700',
    chipAlt: 'bg-green-200 text-green-900 ring-1 ring-inset ring-green-300 dark:bg-green-800 dark:text-green-100 dark:ring-green-700',
    head: 'text-green-600 dark:text-green-400',
    dot: 'bg-green-400',
    hex: '#22c55e',
  },
  NORMAL: {
    label: 'Normal',
    bar: 'bg-gradient-to-r from-blue-400 to-blue-500',
    track: 'bg-blue-400/20',
    chip: 'bg-blue-100 text-blue-900 ring-1 ring-inset ring-blue-300 dark:bg-blue-900 dark:text-blue-100 dark:ring-blue-700',
    chipAlt: 'bg-blue-200 text-blue-900 ring-1 ring-inset ring-blue-300 dark:bg-blue-800 dark:text-blue-100 dark:ring-blue-700',
    head: 'text-blue-600 dark:text-blue-400',
    dot: 'bg-blue-400',
    hex: '#3b82f6',
  },
  HARD: {
    label: 'Hard',
    bar: 'bg-gradient-to-r from-orange-400 to-orange-500',
    track: 'bg-orange-400/20',
    chip: 'bg-orange-100 text-orange-900 ring-1 ring-inset ring-orange-300 dark:bg-orange-900 dark:text-orange-100 dark:ring-orange-700',
    chipAlt: 'bg-orange-200 text-orange-900 ring-1 ring-inset ring-orange-300 dark:bg-orange-800 dark:text-orange-100 dark:ring-orange-700',
    head: 'text-orange-600 dark:text-orange-400',
    dot: 'bg-orange-400',
    hex: '#f97316',
  },
  EXTREME: {
    label: 'Extreme',
    bar: 'bg-gradient-to-r from-red-400 to-red-500',
    track: 'bg-red-400/20',
    chip: 'bg-red-100 text-red-900 ring-1 ring-inset ring-red-300 dark:bg-red-900 dark:text-red-100 dark:ring-red-700',
    chipAlt: 'bg-red-200 text-red-900 ring-1 ring-inset ring-red-300 dark:bg-red-800 dark:text-red-100 dark:ring-red-700',
    head: 'text-red-600 dark:text-red-400',
    dot: 'bg-red-400',
    hex: '#ef4444',
  },
};

/**
 * The same four tiers, deeper and in a shifted hue set.
 *
 * For the second matrix on a page that already has one. Two tables of identical
 * pale tiles read as the same table twice, and the reader has to go back to the
 * heading to work out which is which — so the second one differs in weight AND
 * in hue: emerald, indigo, amber, rose against green, blue, orange, red.
 *
 * Deeper in both themes, not just one. The 100/900 pair the first matrix uses
 * sits close to the card behind it, which is right for a table read alongside
 * others and too quiet for one meant to be told apart at a glance.
 *
 * Text flips with the surface — near-black on the light tiles, near-white on
 * the dark ones — because a fixed foreground fails at one end or the other.
 */
export const DIFFICULTY_TIERS_DEEP: Record<string, DataTier> = {
  EASY: {
    label: 'Easy',
    bar: 'bg-gradient-to-r from-emerald-400 to-emerald-500',
    track: 'bg-emerald-400/20',
    chip: 'bg-emerald-300 text-emerald-950 ring-1 ring-inset ring-emerald-500/40 dark:bg-emerald-700 dark:text-emerald-50 dark:ring-emerald-400/30',
    chipAlt: 'bg-emerald-400 text-emerald-950 ring-1 ring-inset ring-emerald-500/40 dark:bg-emerald-600 dark:text-emerald-50 dark:ring-emerald-400/30',
    head: 'text-emerald-700 dark:text-emerald-300',
    dot: 'bg-emerald-500',
    hex: '#10b981',
  },
  NORMAL: {
    label: 'Normal',
    bar: 'bg-gradient-to-r from-indigo-400 to-indigo-500',
    track: 'bg-indigo-400/20',
    chip: 'bg-indigo-300 text-indigo-950 ring-1 ring-inset ring-indigo-500/40 dark:bg-indigo-700 dark:text-indigo-50 dark:ring-indigo-400/30',
    chipAlt: 'bg-indigo-400 text-indigo-950 ring-1 ring-inset ring-indigo-500/40 dark:bg-indigo-600 dark:text-indigo-50 dark:ring-indigo-400/30',
    head: 'text-indigo-700 dark:text-indigo-300',
    dot: 'bg-indigo-500',
    hex: '#6366f1',
  },
  HARD: {
    label: 'Hard',
    bar: 'bg-gradient-to-r from-amber-400 to-amber-500',
    track: 'bg-amber-400/20',
    chip: 'bg-amber-300 text-amber-950 ring-1 ring-inset ring-amber-500/40 dark:bg-amber-600 dark:text-amber-50 dark:ring-amber-400/30',
    chipAlt: 'bg-amber-400 text-amber-950 ring-1 ring-inset ring-amber-500/40 dark:bg-amber-500 dark:text-amber-950 dark:ring-amber-400/30',
    head: 'text-amber-700 dark:text-amber-300',
    dot: 'bg-amber-500',
    hex: '#f59e0b',
  },
  EXTREME: {
    label: 'Extreme',
    bar: 'bg-gradient-to-r from-rose-400 to-rose-500',
    track: 'bg-rose-400/20',
    chip: 'bg-rose-300 text-rose-950 ring-1 ring-inset ring-rose-500/40 dark:bg-rose-700 dark:text-rose-50 dark:ring-rose-400/30',
    chipAlt: 'bg-rose-400 text-rose-950 ring-1 ring-inset ring-rose-500/40 dark:bg-rose-600 dark:text-rose-50 dark:ring-rose-400/30',
    head: 'text-rose-700 dark:text-rose-300',
    dot: 'bg-rose-500',
    hex: '#f43f5e',
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

/** The deeper set, for a second matrix that has to be told from the first. */
export function difficultyTierDeep(difficulty: string): DataTier {
  return DIFFICULTY_TIERS_DEEP[difficulty] ?? { ...UNKNOWN_TIER, label: difficulty };
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
