import type { UserListFilters } from '@/types/user-hub';
import { describe, expect, it } from 'vitest';
import { readFilters, serialiseFilters } from '@/lib/user-hub-filters';

describe('readFilters', () => {
  it('applies safe defaults for an empty query', () => {
    const f = readFilters(new URLSearchParams(''));

    expect(f).toEqual({
      search: undefined,
      ordering: 'id',
      page: 1,
      is_online: undefined,
      favourite_game: undefined,
      has_favourites: undefined,
      is_beta_tester: undefined,
      suspension: undefined,
      is_active: undefined,
    });
  });

  it('parses all facets', () => {
    const f = readFilters(new URLSearchParams(
      'search=kalin&ordering=-date_joined&page=3&is_online=true&favourite_game=grid&suspension=any&is_active=false',
    ));

    expect(f.search).toBe('kalin');
    expect(f.ordering).toBe('-date_joined');
    expect(f.page).toBe(3);
    expect(f.is_online).toBe('true');
    expect(f.favourite_game).toBe('grid');
    expect(f.suspension).toBe('any');
    expect(f.is_active).toBe('false');
  });

  it('ignores invalid bool / suspension / page values', () => {
    const f = readFilters(new URLSearchParams('is_online=maybe&suspension=bogus&page=0'));

    expect(f.is_online).toBeUndefined();
    expect(f.suspension).toBeUndefined();
    expect(f.page).toBe(1);
  });
});

describe('serialiseFilters', () => {
  it('omits defaults and empties', () => {
    expect(serialiseFilters({ ordering: 'id', page: 1 })).toBe('');
  });

  it('keeps the "false" value (not dropped)', () => {
    expect(serialiseFilters({ is_online: 'false' })).toBe('is_online=false');
  });

  it('round-trips through readFilters', () => {
    const original: UserListFilters = {
      search: 'abc',
      ordering: '-id',
      page: 2,
      is_online: 'false',
      favourite_game: 'the-scout',
      has_favourites: 'true',
      is_beta_tester: 'true',
      suspension: 'FULL_PLATFORM',
      is_active: 'false',
    };
    const back = readFilters(new URLSearchParams(serialiseFilters(original)));

    expect(back).toEqual(original);
  });
});
