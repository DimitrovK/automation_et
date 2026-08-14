import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { chartTheme } from '@/lib/chart-theme';

/**
 * The chart theme and the CSS tokens are one palette kept in two places.
 *
 * They have to be: recharts writes colours into SVG presentation attributes,
 * where `var()` is not something to bet a chart's legibility on, so the chart
 * side needs literal hex. That makes drift possible, and drift here is close to
 * invisible — a chart whose axis text is one palette while the card around it is
 * another looks *slightly* off, not broken, so nobody files it.
 *
 * This already happened once: the tokens moved to the house palette and the
 * chart theme kept the previous cool-slate hexes, so every chart wore the old
 * scheme inside a new card.
 */
function tokens(block: 'root' | 'dark'): Record<string, string> {
  const css = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8');
  // The two blocks are `:root {` and `.dark {`; take from the opener to the
  // first closing brace at the same indentation.
  const opener = block === 'root' ? ':root {' : '.dark {';
  const start = css.indexOf(opener);
  const body = css.slice(start, css.indexOf('\n  }', start));

  const found: Record<string, string> = {};
  // No `\s*` after the colon: whitespace is inside [^;] too, so the two can
  // exchange characters and the match backtracks super-linearly. The value is
  // trimmed below instead.
  for (const [, name, value] of body.matchAll(/--([\w-]+):([^;]+);/g)) {
    found[name] = value.trim();
  }

  return found;
}

/** `150 13% 9%` -> `#141a17`, so a token can be compared with a chart hex. */
function hslTripletToHex(triplet: string): string {
  const [h, s, l] = triplet.split(/\s+/).map(part => Number.parseFloat(part));
  const sat = s / 100;
  const lig = l / 100;
  const c = (1 - Math.abs(2 * lig - 1)) * sat;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const [r1, g1, b1] = hp < 1
    ? [c, x, 0]
    : hp < 2
      ? [x, c, 0]
      : hp < 3
        ? [0, c, x]
        : hp < 4
          ? [0, x, c]
          : hp < 5
            ? [x, 0, c]
            : [c, 0, x];
  const m = lig - c / 2;

  return `#${[r1, g1, b1].map(v => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('')}`;
}

describe('hslTripletToHex', () => {
  it('converts the tokens it is used to check', () => {
    // Guarding the guard: a converter that returned the wrong thing would make
    // every assertion below meaningless in whichever direction it was wrong.
    // Reference values with exact conversions, so this checks the converter
    // rather than restating its own output.
    expect(hslTripletToHex('0 0% 100%')).toBe('#ffffff');
    expect(hslTripletToHex('0 0% 0%')).toBe('#000000');
    expect(hslTripletToHex('0 100% 50%')).toBe('#ff0000');
    expect(hslTripletToHex('120 100% 50%')).toBe('#00ff00');
    expect(hslTripletToHex('240 100% 50%')).toBe('#0000ff');
    expect(hslTripletToHex('150 13% 9%')).toBe('#141a17');
  });
});

describe('chart theme tracks the CSS tokens', () => {
  it('matches light mode', () => {
    const t = tokens('root');
    const theme = chartTheme(false);

    expect(theme.tick.fill).toBe(hslTripletToHex(t['muted-foreground']));
    expect(theme.grid.stroke).toBe(hslTripletToHex(t.border));
    expect(theme.tooltip.contentStyle.backgroundColor).toBe(hslTripletToHex(t.card));
    expect(theme.tooltip.labelStyle.color).toBe(hslTripletToHex(t.foreground));
  });

  it('matches dark mode, except the grid line', () => {
    const t = tokens('dark');
    const theme = chartTheme(true);

    expect(theme.tick.fill).toBe(hslTripletToHex(t['muted-foreground']));
    expect(theme.tooltip.contentStyle.backgroundColor).toBe(hslTripletToHex(t.card));
    expect(theme.tooltip.labelStyle.color).toBe(hslTripletToHex(t.foreground));

    // Deliberately lighter than --border: a hairline that reads on a card reads
    // as nothing on the near-black chart surface behind it. Asserted rather than
    // left as a comment so the exception stays a choice.
    expect(theme.grid.stroke).not.toBe(hslTripletToHex(t.border));
  });

  it('keeps dark surfaces out of the green band', () => {
    // Two attempts at a green-tinted dark surface were rejected as reading like
    // "a green card" rather than a surface. The instinct was to cap saturation,
    // but that measures nothing here: at 7% lightness `#0d1117` and the rejected
    // `#131d18` have IDENTICAL chroma (10/255 in RGB). Only their hue differed.
    //
    // So the rule is about hue, and it is a judgement rather than a law: a green
    // cast at surface scale reads as sickly where a cool one reads as neutral.
    // Written down because it was learned twice.
    const t = tokens('dark');

    for (const name of ['background', 'card', 'popover', 'muted', 'border']) {
      const hue = Number.parseFloat(t[name].split(/\s+/)[0]);

      // One expression, not two `.not`s: as separate assertions they would
      // demand a hue both below 60 and above 170, which no colour satisfies.
      expect(hue < 60 || hue > 170, `--${name} sits in the green band (hue ${hue})`).toBe(true);
    }
  });

  it('gives every categorical slot a distinct colour in both modes', () => {
    for (const isDark of [false, true]) {
      const { series } = chartTheme(isDark);

      expect(new Set(series).size, `duplicate series colour (dark=${isDark})`).toBe(series.length);
    }
  });

  it('separates the first three series by hue, not by lightness', () => {
    // The funnel charts colour three bars from series[0..2]. A previous version
    // used three adjacent steps of ONE emerald ramp: on a light surface the pale
    // end falls below 3:1 against the background, so the steps had to crowd into
    // the dark half and the last two ended up 0.064 apart in luminance —
    // reported as indistinguishable, and rightly.
    //
    // Hue distance rather than luminance distance, because that is the property
    // that failed. Two colours of similar brightness are easy to tell apart when
    // their hues differ; three shades of one hue are not, and a luminance test
    // would wave through the very palette that caused this.
    const hue = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map(i => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
      const max = Math.max(r, g, b);
      const d = max - Math.min(r, g, b);
      if (d === 0) {
        return 0;
      }
      const h = max === r ? 60 * (((g - b) / d) % 6) : max === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4);

      return h < 0 ? h + 360 : h;
    };

    for (const isDark of [false, true]) {
      const hues = chartTheme(isDark).series.slice(0, 3).map(hue);
      const gaps = hues.flatMap((a, i) => hues.slice(i + 1).map((b) => {
        const raw = Math.abs(a - b);

        return Math.min(raw, 360 - raw);
      }));

      expect(Math.min(...gaps), `funnel stages share a hue (dark=${isDark})`).toBeGreaterThan(30);
    }
  });

  it('keeps the sequential ramp monotonic away from the surface', () => {
    // "More" must mean "further from the surface" in both modes: darker on
    // light, lighter on dark. A ramp that reverses direction between themes
    // makes the same chart mean opposite things.
    const luminance = (hex: string) =>
      [1, 3, 5].map(i => Number.parseInt(hex.slice(i, i + 2), 16)).reduce((a, b) => a + b, 0);

    const light = chartTheme(false).ramp.map(luminance);
    const dark = chartTheme(true).ramp.map(luminance);

    expect(light, 'light ramp should darken').toEqual([...light].sort((a, b) => b - a));
    expect(dark, 'dark ramp should lighten').toEqual([...dark].sort((a, b) => a - b));
  });
});
