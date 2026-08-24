import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CAREER_STATE, DIFFICULTY_TIERS, MAGNITUDE_BAR, MAGNITUDE_TRACK } from '@/lib/data-colours';

/**
 * Tailwind only emits classes it can SEE in a scanned file.
 *
 * A class string living outside the scanned sources is a silent failure: no
 * build error, no runtime error, the element simply renders unstyled. It cost
 * a release — the colour vocabulary moved to `lib/`, which was not scanned, so
 * the matrix shipped with coloured boxes on Hard alone. Hard survived only
 * because `bg-orange-600` happened to also appear in a component that was
 * scanned.
 *
 * v4 has no `content` globs: it auto-detects every source file EXCEPT paths
 * that are gitignored or excluded with `@source not`. Those two mechanisms are
 * now the ways `lib/` could silently fall out of the scan, so they are what
 * this guard watches.
 *
 * Nothing else would have caught it: types pass, tests pass, lint passes.
 */
describe('tailwind can see the classes we ship', () => {
  const globals = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8');
  const gitignore = readFileSync(join(process.cwd(), '.gitignore'), 'utf8');

  it('compiles from the stylesheet the app actually imports', () => {
    expect(globals).toContain(`@import 'tailwindcss'`);
  });

  it('never excludes a class-declaring directory from the scan', () => {
    // `lib/` holds the colour vocabulary and `hooks/` may hold more later.
    for (const dir of ['lib', 'components', 'app', 'hooks']) {
      expect(globals, `@source not hides ${dir}/ from Tailwind`).not.toMatch(
        new RegExp(`@source\\s+not\\s+["'][^"']*${dir}`),
      );
      expect(gitignore, `.gitignore hides ${dir}/ from Tailwind's auto-detection`).not.toMatch(
        new RegExp(`^/?${dir}/?\\s*$`, 'm'),
      );
    }
  });

  it('declares colour classes only in scanned directories', () => {
    // The vocabulary lives in lib/, which the assertion above keeps scanned.
    const classes = [
      ...Object.values(DIFFICULTY_TIERS).flatMap(t => [t.bar, t.chip, t.dot, t.head, t.track]),
      ...Object.values(CAREER_STATE).flatMap(s => [s.bar, s.track]),
      MAGNITUDE_BAR,
      MAGNITUDE_TRACK,
    ];

    // Anti-vacuous: if the import ever returns nothing, this must not pass.
    expect(classes.length).toBeGreaterThan(20);

    for (const className of classes) {
      expect(className.trim()).not.toBe('');
    }
  });
});
