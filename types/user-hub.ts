// Types for the admin-only User Hub (favourites analytics + user management).
// Field names mirror the Django BE `AdminUserSerializer` and the
// `/accounts/admin/favourites-usage/` payload — keep them in sync if the BE
// serializer changes.

/** DRF PageNumberPagination envelope (count / next / previous / results). */
export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

// ---- favourites-usage analytics ------------------------------------------

export type FavouritesUsageUser = {
  id: number;
  username: string;
  favourite_games: string[];
};

/** GET /accounts/admin/favourites-usage/ (IsAdminUser). */
export type FavouritesUsageResponse = {
  users_with_favourites: number;
  total_users: number;
  /** game-id slug → number of users who favourited it. */
  game_popularity: Record<string, number>;
  users: FavouritesUsageUser[];
};

// ---- user list / detail ---------------------------------------------------

/** Suspension scopes mirrored from the BE `UserSuspension.scope` choices. */
export type SuspensionScope = 'MULTIPLAYER' | 'ALL_GAMES' | 'FULL_PLATFORM' | null;

/**
 * Subset of `AdminUserSerializer` fields the hub reads. The serializer
 * returns more; we type only what we render so the shape stays honest.
 */
export type HubUser = {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  favourite_games: string[];
  suspension_scope: SuspensionScope;
  suspended_until: string | null;
  suspension_reason?: string | null;
  beta_features: string[];
  is_beta_tester: boolean;
  needs_username_update?: boolean;
  // Presence fields are Redis-derived and may be absent/unknown.
  is_online?: boolean;
  last_seen?: string | null;
  date_joined?: string | null;
  last_login?: string | null;
  profile_picture_url?: string | null;
  date_of_birth?: string | null;
};

export type UserListResponse = Paginated<HubUser>;

/** Query params accepted by `GET /accounts/users/`. */
export type UserListParams = {
  /** DRF SearchFilter — matches username/email/first_name/last_name/phone_number. */
  search?: string;
  /** DRF OrderingFilter field (e.g. `id`, `-username`). */
  ordering?: string;
  page?: number;
};

// ---- per-user rankings ----------------------------------------------------

/**
 * GET /accounts/users/{id}/rankings/ — the BE returns several ranking
 * sections whose inner shapes vary per game. We keep this permissive and
 * render defensively rather than over-fitting nested structures.
 */
export type UserRankingsResponse = {
  game_rankings?: unknown;
  stoppage_time_rankings?: unknown;
  scout_rankings?: unknown;
  conquest_rankings?: unknown;
  grid_rankings?: unknown;
};
