import { describe, expect, it } from 'vitest';
import { chartTheme } from '@/lib/chart-theme';

describe('chartTheme', () => {
  it('sets tooltip text colour, not just background', () => {
    // The bug: recharts renders a white tooltip panel and INHERITS the page's
    // text colour. In dark mode that was white text on white — invisible on
    // every chart page. Setting only the background would not have fixed it.
    const dark = chartTheme(true);

    expect(dark.tooltip.contentStyle.backgroundColor).toBeTruthy();
    expect(dark.tooltip.contentStyle.color).toBeTruthy();
    expect(dark.tooltip.labelStyle.color).toBeTruthy();
    expect(dark.tooltip.itemStyle.color).toBeTruthy();
  });

  it('uses different colours per mode rather than one set for both', () => {
    const light = chartTheme(false);
    const dark = chartTheme(true);

    expect(dark.tooltip.contentStyle.backgroundColor).not.toBe(light.tooltip.contentStyle.backgroundColor);
    expect(dark.tooltip.contentStyle.color).not.toBe(light.tooltip.contentStyle.color);
    expect(dark.tick.fill).not.toBe(light.tick.fill);
  });

  it('keeps grid and axes recessive against the tick text', () => {
    // Grid and axes are support, not content. If they matched the text they
    // would compete with the data for attention.
    for (const isDark of [false, true]) {
      const theme = chartTheme(isDark);

      expect(theme.grid.stroke).not.toBe(theme.tooltip.contentStyle.color);
    }
  });
});
