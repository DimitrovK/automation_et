import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Every field the API sends should reach the UI, or be deliberately listed here.
 *
 * The backend computes several "don't misread this" signals — `pulse_applies`
 * says the pulse describes today whatever range is selected, `coverage` says a
 * day was never computed. The UI silently dropped `pulse_applies` for months, so
 * a historical range rendered today's numbers directly above comparison tiles
 * that DO follow the range. Nothing errored. The page just invited the wrong
 * reading, which is worse than a blank panel.
 *
 * Fetching a field and never rendering it is invisible by construction: no
 * caller goes missing, no type breaks, no test fails. This is the cheapest
 * thing that notices.
 */

const ROOT = process.cwd();

/**
 * Fields that are deliberately not rendered, with the reason. An entry here is
 * a decision; the absence of one is an oversight.
 */
const NOT_RENDERED: Record<string, string> = {
  grain: 'A reminder in the payload that multiplayer counts rooms; the card description says it in prose.',
  games_without_duration: 'Derived per row as `supported`, which DurationTable already groups by.',
  games_without_progress: 'Derived per row as `supported`, which ProgressDropOff already lists with each reason.',
  total_abandoned: 'The games table above it carries abandonment per game and in total; a second total on the same page would be the same number twice.',
  long_lived_session_games: 'Derived per row as `single_sitting`, which DurationTable already groups by.',
  window_totals: 'The comparison tiles render the same window from `comparison`, with movement attached.',
  // #1474 R4 removed the Patterns page: play-by-hour and play-by-weekday move
  // with a handful of people at ~480 sessions a day, and knowing the peak has
  // never changed a decision. The endpoint stays — `by_hour` still feeds the
  // per-game hour profile, and the page's one useful panel (new vs returning)
  // moved to the overview. These are the parts that went with the page.
  by_weekday: 'Patterns page removed (#1474 R4) — weekday shape is noise at this volume.',
  by_hour_weekday: 'Patterns page removed (#1474 R4) — the hour x weekday heatmap went with it.',
  peak_cell: 'Patterns page removed (#1474 R4) — describes the heatmap that is gone.',
  busiest_cell_games: 'Patterns page removed (#1474 R4) — describes the heatmap that is gone.',
  peak_hour: 'Patterns page removed (#1474 R4). The per-game hour profile shows shape, not a single peak.',
  peak_weekday: 'Patterns page removed (#1474 R4) — weekday shape is noise at this volume.',
  total_unfinished: 'The unfinished panel leads with the STALE total; the all-inclusive one counts the last hour, which is mostly people still playing.',
};

function sources(): string {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '__tests__') {
          continue;
        }
        walk(full);
      } else if (/\.tsx?$/.test(entry.name) && !full.endsWith(join('types', 'reports.ts'))) {
        // Comments are stripped: a field named only in prose is documented, not
        // rendered, and would otherwise satisfy this check while the UI still
        // drops the value.
        out.push(
          readFileSync(full, 'utf8')
            .replace(/\/\*[\s\S]*?\*\//g, ' ')
            .replace(/^\s*\/\/.*$/gm, ' '),
        );
      }
    }
  };
  for (const dir of ['app', 'components', 'hooks', 'lib']) {
    walk(join(ROOT, dir));
  }
  return out.join('\n');
}

describe('reporting response fields', () => {
  it('are rendered, or explicitly listed as not rendered', () => {
    const types = readFileSync(join(ROOT, 'types', 'reports.ts'), 'utf8');

    const fields = new Set<string>();
    for (const block of types.matchAll(/export type \w+Response = \{([\s\S]*?)\n\}/g)) {
      for (const field of block[1].matchAll(/^ {2}([a-z_][a-z0-9_]*)\??:/gm)) {
        fields.add(field[1]);
      }
    }

    // A regex that matched nothing would make this pass forever.
    expect(fields.size).toBeGreaterThan(20);

    const blob = sources();
    const dropped = [...fields]
      .filter(name => !new RegExp(`\\b${name}\\b`).test(blob))
      .filter(name => !(name in NOT_RENDERED));

    expect(
      dropped,
      `Sent by the API and never used in the UI: ${dropped.join(', ')}. `
      + 'Render it, or add it to NOT_RENDERED with the reason.',
    ).toEqual([]);
  });

  it('does not keep exemptions for fields that are now rendered', () => {
    // A stale exemption is cover for the next field that gets dropped.
    const blob = sources();
    const stale = Object.keys(NOT_RENDERED).filter(name => new RegExp(`\\b${name}\\b`).test(blob));

    expect(stale, `Listed as not rendered, but used: ${stale.join(', ')}`).toEqual([]);
  });
});
