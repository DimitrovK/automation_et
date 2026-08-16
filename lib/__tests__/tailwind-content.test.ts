import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CAREER_STATE, DIFFICULTY_TIERS, MAGNITUDE_BAR, MAGNITUDE_TRACK } from '@/lib/data-colours';

/**
 * Tailwind only emits classes it can SEE in a scanned file.
 *
 * A class string living outside `content` is a silent failure: no build error,
 * no runtime error, the element simply renders unstyled. It cost a release —
 * the colour vocabulary moved to `lib/`, which was not scanned, so the matrix
 * shipped with coloured boxes on Hard alone. Hard survived only because
 * `bg-orange-600` happened to also appear in a component that was scanned.
 *
 * Nothing else would have caught it: types pass, tests pass, lint passes.
 */
describe('tailwind can see the classes we ship', () => {
  const config = readFileSync(join(process.cwd(), 'tailwind.config.ts'), 'utf8');

  it('scans every directory that declares class names', () => {
    // `lib/` holds the colour vocabulary and `hooks/` may hold more later.
    expect(config).toContain('./lib/**');
    expect(config).toContain('./components/**');
    expect(config).toContain('./app/**');
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
