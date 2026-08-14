import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The reporting surface paints neutrals with semantic tokens, never with a
 * literal step from the Tailwind palette.
 *
 * Before this, the surface carried ~450 hand-written neutral utilities and six
 * token usages, which had two costs. Every element needed its dark variant
 * written out beside it (`text-gray-500 dark:text-gray-400`), so dark mode was
 * maintained by hand and drifted; and the palette lived in the markup, so
 * changing the house colours meant a find-and-replace across ten pages rather
 * than editing `globals.css`.
 *
 * Status hues are deliberately NOT covered here. Emerald means "up", amber
 * means "look at this", red means "wrong" — they carry meaning, they are not
 * surface colours, and they keep their own dark steps.
 */
const BANNED = /\b(?:dark:|hover:|group-hover:|focus:)*(?:text|bg|border|from|to|via|ring|divide)-(?:gray|slate|zinc|neutral|stone)-\d{2,3}\b/;

function sourceFiles(root: string): string[] {
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      // The guard names the classes it forbids, so it would flag itself.
      if (entry.isDirectory() && entry.name !== '__tests__') {
        walk(join(dir, entry.name));
      } else if (entry.isFile() && entry.name.endsWith('.tsx')) {
        found.push(join(dir, entry.name));
      }
    }
  };
  walk(root);

  return found;
}

describe('reporting surface paints with tokens', () => {
  it('has no hardcoded neutral palette steps', () => {
    const files = [
      ...sourceFiles(join(process.cwd(), 'app', 'reports')),
      ...sourceFiles(join(process.cwd(), 'components', 'reports')),
      // The shell wraps every report page, so a literal colour here is on every
      // page at once — which is exactly what happened: it held a green-to-blue
      // gradient that no page-level migration could have reached.
      ...sourceFiles(join(process.cwd(), 'components', 'admin')),
    ];

    const offenders = files
      .map((file) => {
        const hit = readFileSync(file, 'utf8')
          .split('\n')
          .map((line, i) => (BANNED.test(line) ? `${file.replace(process.cwd(), '')}:${i + 1} ${line.trim()}` : null))
          .filter(Boolean);

        return hit;
      })
      .flat();

    expect(
      offenders,
      'Use bg-card / bg-muted / text-foreground / text-muted-foreground / border-border instead',
    ).toEqual([]);
  });

  it('has no page-level gradients', () => {
    // Depth comes from cards on a flat surface. A gradient behind the content
    // was the loudest thing on screen and competed with the charts, whose own
    // colours are the data — two hues arguing under a third that means
    // something. One job per layer.
    const files = [
      ...sourceFiles(join(process.cwd(), 'app', 'reports')),
      ...sourceFiles(join(process.cwd(), 'components', 'reports')),
      ...sourceFiles(join(process.cwd(), 'components', 'admin')),
    ];

    const offenders = files.filter(file => readFileSync(file, 'utf8').includes('bg-gradient'));

    expect(
      offenders.map(f => f.replace(process.cwd(), '')),
      'Reporting surfaces are flat; elevation comes from cards',
    ).toEqual([]);
  });

  it('is actually looking at files', () => {
    // A walk that silently returned nothing would make the guard above pass
    // forever, which is the failure mode that matters for a check like this.
    const files = sourceFiles(join(process.cwd(), 'components', 'reports'));

    expect(files.length).toBeGreaterThan(20);
  });
});
