import { describe, expect, it } from 'vitest';
import { popularityRows } from '@/lib/favourites-chart';

const META = {
  'line-up-game': { key: 'missing11', label: 'Guess The Line Up Game Sessions', display_name: 'Guess The Line Up', favourite_slug: 'line-up-game', color: '#166534', color_dark: '#16a34a' },
  'grid': { key: 'grid', label: 'Grid Game Sessions', display_name: 'Grid', favourite_slug: 'grid', color: '#f97316', color_dark: '#fdba74' },
};

const POPULARITY = { 'line-up-game': 7, 'grid': 3, 'tenagoal': 1 };

describe('popularityRows', () => {
  it('names games from the registry rather than prettifying the slug', () => {
    // "Line Up Game" is what the slug prettifies to; "Guess The Line Up" is
    // what the game is called everywhere else in Reports.
    const rows = popularityRows(POPULARITY, META as never, false);

    expect(rows.map(r => r.label)).toEqual(['Guess The Line Up', 'Grid', 'Tenagoal']);
  });

  it('draws each game in its registry colour, per surface', () => {
    // This chart used to cycle a local ten-colour array by rank, so a game's
    // colour changed when the ranking did and matched nothing else in Reports.
    expect(popularityRows(POPULARITY, META as never, false).map(r => r.fill))
      .toEqual(['#166534', '#f97316', '#94a3b8']);
    expect(popularityRows(POPULARITY, META as never, true).map(r => r.fill))
      .toEqual(['#16a34a', '#fdba74', '#94a3b8']);
  });

  it('keeps most-favourited first', () => {
    expect(popularityRows(POPULARITY, META as never, false).map(r => r.count)).toEqual([7, 3, 1]);
  });

  it('leaves an unknown game neutral rather than borrowing another game\'s colour', () => {
    // A game the backend hasn't declared a slug for must not silently inherit
    // whatever colour happens to sit at its index.
    const rows = popularityRows({ tenagoal: 1 }, META as never, false);

    expect(rows[0]).toMatchObject({ label: 'Tenagoal', fill: '#94a3b8' });
  });
});
