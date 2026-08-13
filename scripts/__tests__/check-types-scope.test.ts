import { describe, expect, it } from 'vitest';
import { inScope } from '../check-types.mjs';

describe('inScope', () => {
  it('matches a scoped path', () => {
    expect(inScope('components/reports/GameBadge.tsx(6,1): error TS6133: unused')).toBe(true);
  });

  it('matches the same path with Windows separators', () => {
    // tsc prints backslashes on Windows. A prefix match against forward slashes
    // would match nothing there — the gate would report success on every file
    // it exists to guard, which is worse than no gate because it is trusted.
    expect(inScope('components\\reports\\GameBadge.tsx(6,1): error TS6133: unused')).toBe(true);
  });

  it('leaves paths outside the scope alone', () => {
    // The rest of the app has ~40 of these and some are bug evidence rather
    // than dead code. Widening this filter by accident would invite deleting
    // them.
    expect(inScope('app/career-lookup/page.tsx(3,1): error TS6133: unused')).toBe(false);
    expect(inScope('app\\career-lookup\\page.tsx(3,1): error TS6133: unused')).toBe(false);
  });
});
