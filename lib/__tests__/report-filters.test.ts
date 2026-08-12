import { describe, expect, it } from 'vitest';

// The parse/serialise pair is the testable core; the hook around it is just
// mount + replaceState wiring.
import { __test } from '@/hooks/use-report-filters';

const defaults = {
  range: { window: 30 as const },
  includeBots: false,
  game: null,
  metric: 'games_started' as const,
};

describe('report filter URL state', () => {
  it('round-trips a custom range', () => {
    const filters = { ...defaults, range: { window: 30 as const, start: '2026-06-01', end: '2026-06-30' } };
    const query = __test.serialise(filters, defaults);

    expect(query).toBe('?start=2026-06-01&end=2026-06-30');
    expect(__test.parse(query, defaults).range).toEqual({ window: 30, start: '2026-06-01', end: '2026-06-30' });
  });

  it('omits defaults so a shared link shows only what was chosen', () => {
    expect(__test.serialise(defaults, defaults)).toBe('');
  });

  it('ignores a malformed date rather than passing it to the API', () => {
    // The API would 400; a shared link with a typo should degrade to the default
    // view, not an error panel.
    expect(__test.parse('?start=not-a-date', defaults).range).toEqual({ window: 30 });
  });

  it('rejects a window the API would refuse', () => {
    expect(__test.parse('?window=999', defaults).range.window).toBe(30);
  });

  it('reads game and bots flags', () => {
    const parsed = __test.parse('?game=grid&bots=1', defaults);

    expect(parsed.game).toBe('grid');
    expect(parsed.includeBots).toBe(true);
  });
});
