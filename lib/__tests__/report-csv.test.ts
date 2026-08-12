import { describe, expect, it } from 'vitest';
import { csvFilename, toCsv } from '@/lib/report-csv';

type Row = { name: string; count: number; pct: number | null };

const columns = [
  { header: 'Name', value: (r: Row) => r.name },
  { header: 'Count', value: (r: Row) => r.count },
  { header: 'Pct', value: (r: Row) => r.pct },
];

describe('toCsv', () => {
  it('writes a header and one line per row', () => {
    expect(toCsv([{ name: 'grid', count: 5, pct: 12.5 }], columns))
      .toBe('Name,Count,Pct\ngrid,5,12.5');
  });

  it('renders null as empty, not as the string "null"', () => {
    expect(toCsv([{ name: 'quiz', count: 0, pct: null }], columns))
      .toBe('Name,Count,Pct\nquiz,0,');
  });

  it('quotes and doubles embedded quotes, commas and newlines', () => {
    const rows = [{ name: 'a,b "c"\nd', count: 1, pct: null }];

    expect(toCsv(rows, columns)).toContain('"a,b ""c""\nd"');
  });

  it('neutralises spreadsheet formula injection', () => {
    // Usernames land in these exports, so `=cmd()` opening as a formula in Excel
    // is a real path rather than a theoretical one.
    const rows = [{ name: '=1+1', count: 1, pct: null }, { name: '@SUM(A1)', count: 2, pct: null }];
    const csv = toCsv(rows, columns);

    expect(csv).toContain('\'=1+1');
    expect(csv).toContain('\'@SUM(A1)');
  });
});

describe('csvFilename', () => {
  it('carries the filters so a folder of exports stays interpretable', () => {
    expect(csvFilename('games', { start: '2026-06-01', end: '2026-06-30', game: 'grid' }))
      .toBe('extratime-games_start-2026-06-01_end-2026-06-30_game-grid.csv');
  });

  it('drops empty filters and renders flags as bare names', () => {
    expect(csvFilename('players', { window: 30, game: null, bots: true, other: false }))
      .toBe('extratime-players_window-30_bots.csv');
  });
});
