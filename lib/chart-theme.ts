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
};

/** Text tokens, never a series colour — identity comes from the mark beside it. */
const LIGHT = {
  text: '#334155',
  muted: '#64748b',
  line: '#cbd5e1',
  surface: '#ffffff',
  border: '#e2e8f0',
};

const DARK = {
  text: '#e2e8f0',
  muted: '#94a3b8',
  line: '#475569',
  surface: '#1e293b',
  border: '#334155',
};

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
      cursor: { fill: isDark ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.06)' },
    },
    legend: { fontSize: 12, color: c.muted },
  };
}
