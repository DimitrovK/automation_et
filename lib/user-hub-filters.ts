// Pure (de)serialisation between the Users-page URL query string and the typed
// UserListFilters object. Kept framework-free so it round-trips in unit tests
// and the page stays thin.

import type { BoolParam, SuspensionFilter, UserListFilters } from '@/types/user-hub';

const DEFAULT_ORDERING = 'id';

const SUSPENSION_VALUES: SuspensionFilter[] = ['none', 'any', 'MULTIPLAYER', 'ALL_GAMES', 'FULL_PLATFORM'];

function asBool(value: string | null): BoolParam | undefined {
  return value === 'true' || value === 'false' ? value : undefined;
}

/** Parse a URL query into the typed filter state, applying safe defaults. */
export function readFilters(params: URLSearchParams): UserListFilters {
  const str = (k: string) => params.get(k) || undefined;
  const pageRaw = Number.parseInt(params.get('page') ?? '1', 10);
  const suspension = params.get('suspension');

  return {
    search: str('search'),
    ordering: str('ordering') ?? DEFAULT_ORDERING,
    page: Number.isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw,
    is_online: asBool(params.get('is_online')),
    favourite_game: str('favourite_game'),
    has_favourites: asBool(params.get('has_favourites')),
    is_beta_tester: asBool(params.get('is_beta_tester')),
    suspension: SUSPENSION_VALUES.includes(suspension as SuspensionFilter)
      ? (suspension as SuspensionFilter)
      : undefined,
    is_active: asBool(params.get('is_active')),
  };
}

/**
 * Serialise filter state back to a query string, omitting defaults/empties so
 *  URLs stay clean (no `?ordering=id&page=1`).
 */
export function serialiseFilters(f: UserListFilters): string {
  const p = new URLSearchParams();
  if (f.search) {
    p.set('search', f.search);
  }
  if (f.ordering && f.ordering !== DEFAULT_ORDERING) {
    p.set('ordering', f.ordering);
  }
  if (f.page && f.page > 1) {
    p.set('page', String(f.page));
  }
  if (f.is_online) {
    p.set('is_online', f.is_online);
  }
  if (f.favourite_game) {
    p.set('favourite_game', f.favourite_game);
  }
  if (f.has_favourites) {
    p.set('has_favourites', f.has_favourites);
  }
  if (f.is_beta_tester) {
    p.set('is_beta_tester', f.is_beta_tester);
  }
  if (f.suspension) {
    p.set('suspension', f.suspension);
  }
  if (f.is_active) {
    p.set('is_active', f.is_active);
  }
  return p.toString();
}
