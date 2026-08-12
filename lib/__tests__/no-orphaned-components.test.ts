import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Guards against building a component and never rendering it.
 *
 * ModeBreakdown was written, reviewed and merged complete — and then wasn't
 * imported anywhere for several PRs. `by_mode` was fetched on every multiplayer
 * request and thrown away. Nothing failed: tests passed, types passed, the page
 * rendered. The feature simply wasn't there.
 *
 * Dead UI code fails silently in a way dead logic doesn't, because there's no
 * caller to notice. This is the cheapest thing that would have caught it.
 */

const ROOT = process.cwd();
const COMPONENT_DIR = join(ROOT, 'components', 'reports');

/** Directories that can legitimately reference a component. */
const SEARCH_DIRS = ['app', 'components', 'hooks', 'lib'];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__') {
        continue;
      }
      out.push(...walk(full));
    } else if (/\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

describe('report components', () => {
  it('are all rendered somewhere', () => {
    const components = readdirSync(COMPONENT_DIR)
      .filter(name => name.endsWith('.tsx'))
      .map(name => name.replace(/\.tsx$/, ''));

    // If this is ever empty the test would pass vacuously and guard nothing.
    expect(components.length).toBeGreaterThan(5);

    // Components legitimately render each other (ReportsShell renders
    // ReportsNav), so only the component's OWN file is excluded — excluding the
    // whole directory would report a used component as orphaned.
    const files = SEARCH_DIRS.flatMap(dir => walk(join(ROOT, dir)))
      .map(file => ({ file, source: readFileSync(file, 'utf8') }));

    const orphaned = components.filter((name) => {
      const own = join(COMPONENT_DIR, `${name}.tsx`);
      return !files.some(
        ({ file, source }) => file !== own && new RegExp(`\\b${name}\\b`).test(source),
      );
    });

    expect(orphaned, `Built but never rendered: ${orphaned.join(', ')}`).toEqual([]);
  });
});
