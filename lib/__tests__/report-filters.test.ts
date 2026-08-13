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
        if (entry.isDirectory()) return pages(full);
        return entry.name === 'page.tsx' ? [full] : [];
      });
    }

    const found = pages(root);
    expect(found.length).toBeGreaterThan(5);

    const offenders = found.filter((file) => {
      const source = readFileSync(file, 'utf8');
      // A page with no range picker has no filters to share.
      if (!source.includes('RangePicker')) return false;
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
        if (entry.isDirectory()) return pages(full);
        return entry.name === 'page.tsx' ? [full] : [];
      });
    }

    const found = pages(root);
    expect(found.length).toBeGreaterThan(5);

    const offenders = found.filter((file) => {
      const source = readFileSync(file, 'utf8');
      // The glossary is reference text, and the drill-downs are a single
      // record — neither is a dataset anyone would take to a spreadsheet.
      if (file.includes('glossary') || file.includes('[id]') || file.includes('[key]')) return false;
      // A page with no range picker isn't a data view.
      if (!source.includes('RangePicker')) return false;
      return !source.includes('ExportButton');
    });

    expect(
      offenders.map(f => f.replace(process.cwd(), '')),
      'Report pages with no CSV export — the data can be read but not taken anywhere',
    ).toEqual([]);
  });
});
