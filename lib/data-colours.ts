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
  /** Tinted background for a matrix cell; `--tint` sets the opacity. */
  chip: string;
  /** Text colour for a column header. */
  head: string;
  /** Solid dot carrying the colour into a legend or header. */
  dot: string;
  /** The same colour for recharts. Tailwind 500-weight. */
  hex: string;
};

/** Cool to hot. Order is the scale — do not sort these alphabetically. */
export const DIFFICULTY_TIERS: Record<string, DataTier> = {
  EASY: {
    label: 'Easy',
    bar: 'bg-emerald-500',
    chip: 'bg-emerald-500/[var(--tint)] text-emerald-950 dark:text-emerald-50',
    head: 'text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    hex: '#10b981',
  },
  NORMAL: {
    label: 'Normal',
    bar: 'bg-sky-500',
    chip: 'bg-sky-500/[var(--tint)] text-sky-950 dark:text-sky-50',
    head: 'text-sky-700 dark:text-sky-400',
    dot: 'bg-sky-500',
    hex: '#0ea5e9',
  },
  HARD: {
    label: 'Hard',
    bar: 'bg-amber-500',
    chip: 'bg-amber-500/[var(--tint)] text-amber-950 dark:text-amber-50',
    head: 'text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
    hex: '#f59e0b',
  },
  EXTREME: {
    label: 'Extreme',
    bar: 'bg-rose-500',
    chip: 'bg-rose-500/[var(--tint)] text-rose-950 dark:text-rose-50',
    head: 'text-rose-700 dark:text-rose-400',
    dot: 'bg-rose-500',
    hex: '#f43f5e',
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
  retired: { label: 'Retired', bar: 'bg-slate-400 dark:bg-slate-500', hex: '#94a3b8' },
} as const;

/**
 * Magnitude with no category behind it — squad size, row counts.
 *
 * One colour, deliberately: shading these by value would imply a threshold
 * ("amber means concerning") that a squad size does not have.
 */
export const MAGNITUDE_BAR = 'bg-primary/70';
