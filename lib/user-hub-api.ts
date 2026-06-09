import type {
  AdoptionTrendsResponse,
  FavouredVsPlayedResponse,
  FavouritesUsageResponse,
  HubUser,
  TrendGranularity,
  UserListParams,
  UserListResponse,
} from '@/types/user-hub';
import { apiFetcher } from '@/lib/api-fetcher';

/**
 * Build a `?key=value&...` string from a params object, dropping `undefined`,
 *  `null`, the literal string `'all'`, and empty strings. Mirrors `team-api`.
 */
function buildQuery(params: Record<string, unknown> | undefined): string {
  if (!params) {
    return '';
  }
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '' || value === 'all') {
      continue;
    }
    search.append(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Admin-only User Hub endpoints (all require `IsAdminUser` server-side; the
 * Bearer JWT is attached by `apiFetcher`). Read-only in Phase 1 — there is
 * intentionally NO delete or write method here.
 */
export class UserHubAPI {
  /** GET /accounts/admin/favourites-usage/ — favourites adoption + popularity. */
  static async getFavouritesUsage(): Promise<FavouritesUsageResponse> {
    return apiFetcher<FavouritesUsageResponse>('accounts/admin/favourites-usage/');
  }

  /** GET /accounts/users/ — paginated, searchable (?search=), orderable (?ordering=). */
  static async listUsers(params?: UserListParams): Promise<UserListResponse> {
    const qs = buildQuery(params as Record<string, unknown> | undefined);
    return apiFetcher<UserListResponse>(`accounts/users/${qs}`);
  }

  /** GET /accounts/users/{id}/ — single user (admin detail). */
  static async getUser(id: number): Promise<HubUser> {
    return apiFetcher<HubUser>(`accounts/users/${id}/`);
  }

  /** GET /accounts/admin/favourites-trends/ — adoption over time. */
  static async getAdoptionTrends(granularity?: TrendGranularity): Promise<AdoptionTrendsResponse> {
    const qs = buildQuery(granularity ? { granularity } : undefined);
    return apiFetcher<AdoptionTrendsResponse>(`accounts/admin/favourites-trends/${qs}`);
  }

  /** GET /accounts/admin/favourites-vs-played/ — favourited vs started/finished. */
  static async getFavouredVsPlayed(): Promise<FavouredVsPlayedResponse> {
    return apiFetcher<FavouredVsPlayedResponse>('accounts/admin/favourites-vs-played/');
  }
}
