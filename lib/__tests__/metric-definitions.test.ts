import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { METRIC_DEFINITIONS, METRICS_BY_KEY } from '@/lib/metric-definitions';

const ROOT = process.cwd();

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
      out.push(...walk(full));
    } else if (/\.tsx?$/.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

describe('metric definitions', () => {
  it('exist for every metric the UI points at', () => {
    // A <MetricInfo metric="..."/> with no definition renders nothing at all —
    // it fails silently, so the affordance just quietly disappears.
    const sources = ['app', 'components'].flatMap(dir => walk(join(ROOT, dir)))
      .map(file => readFileSync(file, 'utf8'));

    const referenced = new Set<string>();
    for (const source of sources) {
      for (const match of source.matchAll(/metric[=:]\s*['"]([a-z_]+)['"]/g)) {
        referenced.add(match[1]);
      }
    }

    expect(referenced.size).toBeGreaterThan(0);

    const missing = [...referenced].filter(key => !METRICS_BY_KEY[key]);
    expect(missing, `Referenced with no definition: ${missing.join(', ')}`).toEqual([]);
  });

  it('have unique keys', () => {
    const keys = METRIC_DEFINITIONS.map(d => d.key);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it('only cross-reference metrics that exist', () => {
    // A dead `related` key renders a link to an anchor that isn't on the page.
    const dangling = METRIC_DEFINITIONS.flatMap(
      d => (d.related ?? []).filter(key => !METRICS_BY_KEY[key]).map(key => `${d.key} -> ${key}`),
    );

    expect(dangling, `Dangling cross-references: ${dangling.join(', ')}`).toEqual([]);
  });

  it('say what they count and what they exclude', () => {
    for (const definition of METRIC_DEFINITIONS) {
      expect(definition.counts.length, `${definition.key} has no "counts"`).toBeGreaterThan(20);
      // `excludes` may be empty, but must be a deliberate empty string rather
      // than undefined — "nothing is excluded" is itself a claim worth making.
      expect(typeof definition.excludes, `${definition.key} has no "excludes"`).toBe('string');
    }
  });
});
