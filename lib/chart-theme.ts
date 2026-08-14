/**
 * Shared chart styling, so every chart reads the same and survives dark mode.
 *
 * Recharts styles nothing by default: axis ticks fall back to a fixed grey and
 * the tooltip renders a white panel that INHERITS the page's text colour. In
 * dark mode that meant white text on a white tooltip — invisible, on every chart
 * page, which is the bug this exists to remove.
 *
 * It also keeps the marks recessive on purpose: grid and axes are support, not
 * content, so they sit well below the data in contrast.
 */

export type ChartTheme = {
  tick: { fontSize: number; fill: string };
  axisLine: { stroke: string };
  grid: { stroke: string };
  tooltip: {
    contentStyle: React.CSSProperties;
    labelStyle: React.CSSProperties;
    itemStyle: React.CSSProperties;
    cursor: { fill: string };
  };
  legend: React.CSSProperties;
  /**
   * Categorical series, in fixed order. Index by series position and never
   * cycle: a ninth series is not a generated hue, it folds into "Other" or the
   * chart becomes small multiples.
   *
   * For charts WITH a game dimension, colour comes from the backend registry
   * instead — a game keeps its hue everywhere it appears, which a positional
   * palette cannot promise.
   */
  series: string[];
  /**
   * Sequential ramp for magnitude (the heatmap, funnel stages) — one hue,
   * monotonic in lightness. Light mode runs light→dark, dark mode dark→light,
   * because "more" has to mean "further from the surface" in both.
   */
  ramp: string[];
};

/**
 * Neutrals. These mirror the `--foreground` / `--muted-foreground` / `--border`
 * / `--card` tokens in globals.css, converted to hex because recharts writes
 * them into SVG presentation attributes, where `var()` support is not something
 * to bet a chart's legibility on.
 *
 * `chart-theme.test.ts` reads globals.css and fails if these drift from the
 * tokens — two copies of a palette is exactly how the surface ended up with
 * ~450 hand-typed colours in the first place.
 */
const LIGHT = {
  text: '#121613',
  muted: '#65726c',
  line: '#e2e4e2',
  surface: '#ffffff',
  border: '#e2e4e2',
};

const DARK = {
  text: '#f1f3f1',
  muted: '#99a39c',
  // A step lighter than --border: a hairline that reads on a card reads as
  // nothing at all on the near-black chart surface behind it.
  line: '#393c3a',
  surface: '#181b18',
  border: '#2d2f2d',
};

/**
 * Validated as a set, not picked by eye — OKLCH lightness band, chroma floor,
 * adjacent-pair separation under deutan/protan/tritan, and >= 3:1 against the
 * mode's surface.
 *
 * Dark is NOT light-brightened. The validator's dark lightness band sits BELOW
 * the light band, so lightening every hue puts amber and emerald out of band;
 * only the last two slots move.
 */
const SERIES_LIGHT = ['#059669', '#0284c7', '#d97706', '#7c3aed', '#e11d48'];
const SERIES_DARK = ['#059669', '#0284c7', '#d97706', '#8b5cf6', '#f43f5e'];

/*
 * Emerald, monotonic. Deliberately the brand hue: a ramp encodes magnitude of
 * one thing, so it does not compete with the categorical slots above.
 *
 * These are the heatmap's steps, lifted here rather than replaced. They were
 * already chosen against each surface for single hue, monotone lightness,
 * adjacent steps >= 0.06 apart, and a lightest step clearing 2:1 so a low cell
 * is still distinguishable from an empty one. A fresh ramp would have had to
 * re-earn all four properties to be no better.
 */
const RAMP_LIGHT = ['#10b981', '#059669', '#047857', '#064e3b'];
const RAMP_DARK = ['#047857', '#059669', '#34d399', '#a7f3d0'];

export function chartTheme(isDark: boolean): ChartTheme {
  const c = isDark ? DARK : LIGHT;
  return {
    tick: { fontSize: 11, fill: c.muted },
    axisLine: { stroke: c.line },
    grid: { stroke: c.line },
    tooltip: {
      // Both background AND colour are set: setting only the background leaves
      // the text inheriting from the page, which is how this broke.
      contentStyle: {
        fontSize: 12,
        backgroundColor: c.surface,
        border: `1px solid ${c.border}`,
        borderRadius: 6,
        color: c.text,
      },
      labelStyle: { color: c.text, fontWeight: 600 },
      itemStyle: { color: c.text },
      cursor: { fill: isDark ? 'rgba(143,163,150,0.14)' : 'rgba(15,26,20,0.06)' },
    },
    legend: { fontSize: 12, color: c.muted },
    series: isDark ? SERIES_DARK : SERIES_LIGHT,
    ramp: isDark ? RAMP_DARK : RAMP_LIGHT,
  };
}
