import { describe, expect, it } from 'vitest';
import { byFavouriteSlug } from '@/hooks/use-game-meta';

const META = {
  missing11: { key: 'missing11', label: 'Guess The Line Up Game Sessions', display_name: 'Guess The Line Up', favourite_slug: 'line-up-game', color: '#166534', color_dark: '#16a34a' },
  tenable: { key: 'tenable', label: 'Tenable Game Sessions', display_name: 'Tenable', favourite_slug: 'tenagoal', color: '#b91c1c' },
  grid: { key: 'grid', label: 'Grid Game Sessions', display_name: 'Grid', favourite_slug: 'grid', color: '#f97316' },
};

describe('byFavouriteSlug', () => {
  it('re-keys the registry by the frontend slug, which is not the registry key', () => {
    // The whole point: favourites are stored as 'line-up-game'/'tenagoal', and
    // no transform turns those into 'missing11'/'tenable'.
    const bySlug = byFavouriteSlug(META);

    expect(bySlug['line-up-game'].key).toBe('missing11');
    expect(bySlug.tenagoal.key).toBe('tenable');
    expect(bySlug.grid.key).toBe('grid');
  });

  it('leaves the registry keys behind', () => {
    // Indexing by the wrong vocabulary is the failure this exists to prevent —
    // it would look like it worked for the eight games that happen to match.
    const bySlug = byFavouriteSlug(META);

    expect(bySlug.missing11).toBeUndefined();
    expect(bySlug.tenable).toBeUndefined();
  });

  it('drops games from a backend that predates favourite_slug', () => {
    // Absent, not mis-keyed: the caller then falls back to the neutral colour
    // and a prettified slug rather than colouring the wrong game.
    const legacy = { grid: { key: 'grid', label: 'Grid', color: '#f97316' } };

    expect(byFavouriteSlug(legacy)).toEqual({});
  });
});
