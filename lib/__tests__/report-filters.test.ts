import { describe, expect, it } from 'vitest';

// The parse/serialise pair is the testable core; the hook around it is just
// mount + replaceState wiring.
import { __test } from '@/hooks/use-report-filters';

const defaults = {
  range: { window: 30 as const },
  includeBots: false,
  game: null,
  metric: 'games_started' as const,
  limit: 25,
  search: '',
  compareOffset: 1,
};

describe('report filter URL state', () => {
  it('carries a player search, and treats blank as no filter', () => {
    // In the URL so "find this player" is a link that can be sent. Trimmed,
    // because "  " in a shared link would show a filtered-looking box while
    // matching everyone.
    expect(__test.serialise({ ...defaults, search: 'kalin' }, defaults)).toBe('?search=kalin');
    expect(__test.serialise({ ...defaults, search: '' }, defaults)).toBe('');
    expect(__test.parse('?search=kalin', defaults).search).toBe('kalin');
    expect(__test.parse('?search=%20%20', defaults).search).toBe('');
  });

  it('carries a chosen row limit, and drops it when it is the default', () => {
    expect(__test.serialise({ ...defaults, limit: 100 }, defaults)).toBe('?limit=100');
    expect(__test.serialise({ ...defaults, limit: 25 }, defaults)).toBe('');
    expect(__test.parse('?limit=100', defaults).limit).toBe(100);
  });

  it('ignores a limit the API would reject rather than passing it on', () => {
    // MAX_LIMIT is 100 server-side; anything else 400s. A shared link with a
    // silly value should degrade to the default view, like a malformed date.
    expect(__test.parse('?limit=9999', defaults).limit).toBe(25);
    expect(__test.parse('?limit=0', defaults).limit).toBe(25);
    expect(__test.parse('?limit=abc', defaults).limit).toBe(25);
    expect(__test.parse('?limit=12.5', defaults).limit).toBe(25);
  });

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

  it('carries a chosen comparison offset, and drops it when it is the default', () => {
    // Only the summary compares periods, so the other pages never mention it.
    expect(__test.serialise({ ...defaults, compareOffset: 3 }, defaults)).toBe('?compare_offset=3');
    expect(__test.serialise({ ...defaults, compareOffset: 1 }, defaults)).toBe('');
    expect(__test.parse('?compare_offset=3', defaults).compareOffset).toBe(3);
  });

  it('falls back to the default for an offset the API would reject', () => {
    // A shared link with a typo should degrade to the default view rather than
    // to an error panel.
    for (const bad of ['0', '-2', '13', 'lots', '1.5']) {
      expect(__test.parse(`?compare_offset=${bad}`, defaults).compareOffset).toBe(1);
    }
  });

  it('carries an explicitly named comparison period instead of the offset', () => {
    // The API ignores the offset when explicit dates are given, so a link
    // carrying both would suggest otherwise.
    const named = { ...defaults, compareOffset: 4, compareStart: '2026-01-01', compareEnd: '2026-01-31' };

    expect(__test.serialise(named, defaults)).toBe('?compare_start=2026-01-01&compare_end=2026-01-31');
    expect(__test.parse('?compare_start=2026-01-01&compare_end=2026-01-31', defaults)).toMatchObject({
      compareStart: '2026-01-01',
      compareEnd: '2026-01-31',
    });
  });

  it('ignores half a comparison range rather than sending a request the API rejects', () => {
    expect(__test.parse('?compare_start=nonsense&compare_end=2026-01-31', defaults).compareStart).toBeUndefined();
    expect(__test.parse('?compare_start=2026-01-01&compare_end=nonsense', defaults).compareStart).toBeUndefined();
  });
});

describe('every report page keeps its filters in the URL', () => {
  it('has no page falling back to local-only state', async () => {
    // useReportFilters existed for months and was wired into exactly one page,
    // so eight report views could not be shared, bookmarked, or survive a
    // refresh. Nothing failed — the pages worked, they just quietly forgot.
    const { readdirSync, readFileSync } = await import('node:fs');
    const { join } = await import('node:path');

    const root = join(process.cwd(), 'app', 'reports');

    function pages(dir: string): string[] {
      return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          return pages(full);
        }
        return entry.name === 'page.tsx' ? [full] : [];
      });
    }

    const found = pages(root);

    expect(found.length).toBeGreaterThan(5);

    const offenders = found.filter((file) => {
      const source = readFileSync(file, 'utf8');
      // A page with no range picker has no filters to share.
      if (!source.includes('RangePicker')) {
        return false;
      }
      // Holding the range in local state is the actual anti-pattern, and the
      // shape a new page naturally reaches for. Checking only for the hook's
      // name matched even after its import was removed.
      return /useState<RangeState>/.test(source) || !/useReportFilters\(/.test(source);
    });

    expect(
      offenders.map(f => f.replace(process.cwd(), '')),
      'Report pages holding filters in local state only — they cannot be shared or bookmarked',
    ).toEqual([]);
  });
});

describe('every report page can be exported', () => {
  it('has no data page without a CSV export', async () => {
    // ExportButton and the CSV helper existed and were wired into one page out
    // of seven, so six reports could be read but not taken anywhere. Nothing
    // failed — the pages simply had no way out of the browser.
    const { readdirSync, readFileSync } = await import('node:fs');
    const { join } = await import('node:path');

    const root = join(process.cwd(), 'app', 'reports');

    function pages(dir: string): string[] {
      return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
          return pages(full);
        }
        return entry.name === 'page.tsx' ? [full] : [];
      });
    }

    const found = pages(root);

    expect(found.length).toBeGreaterThan(5);

    const offenders = found.filter((file) => {
      const source = readFileSync(file, 'utf8');
      // The glossary is reference text, and the drill-downs are a single
      // record — neither is a dataset anyone would take to a spreadsheet.
      if (file.includes('glossary') || file.includes('[id]') || file.includes('[key]')) {
        return false;
      }
      // A page with no range picker isn't a data view.
      if (!source.includes('RangePicker')) {
        return false;
      }
      return !source.includes('ExportButton');
    });

    expect(
      offenders.map(f => f.replace(process.cwd(), '')),
      'Report pages with no CSV export — the data can be read but not taken anywhere',
    ).toEqual([]);
  });
});
