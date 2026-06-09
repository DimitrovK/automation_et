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

// ---- adoption-over-time trends --------------------------------------------

export type TrendGranularity = 'day' | 'week';

export type TrendPoint = {
  /** ISO date (period start). */
  date: string;
  new_adopters: number;
  cumulative_users: number;
};

/** GET /accounts/admin/favourites-trends/ (IsAdminUser). */
export type AdoptionTrendsResponse = {
  granularity: TrendGranularity;
  include_backfill: boolean;
  points: TrendPoint[];
};

// ---- favourited vs played -------------------------------------------------

export type GameEngagementRow = {
  slug: string;
  favourited_count: number;
  started_count: number;
  finished_count: number;
  /** Of favouriters who started, the share who finished (0–100). */
  play_through_pct: number;
};

/** GET /accounts/admin/favourites-vs-played/ (IsAdminUser). */
export type FavouredVsPlayedResponse = {
  games: GameEngagementRow[];
  total_users: number;
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

/**
 * Tri-state boolean filters use string `'true'`/`'false'` (not boolean) so they
 *  map 1:1 to URL params and dodge `buildQuery`'s falsy-skip ambiguity.
 */
export type BoolParam = 'true' | 'false';

/** Suspension filter values: not-suspended, any-suspension, or an exact scope. */
export type SuspensionFilter = 'none' | 'any' | 'MULTIPLAYER' | 'ALL_GAMES' | 'FULL_PLATFORM';

/** Query params accepted by `GET /accounts/users/` (mirrors AdminUserFilter). */
export type UserListParams = {
  /** DRF SearchFilter — matches username/email/first_name/last_name/phone_number. */
  search?: string;
  /** DRF OrderingFilter field (e.g. `id`, `-username`, `-date_joined`). */
  ordering?: string;
  page?: number;
  is_online?: BoolParam;
  favourite_game?: string;
  has_favourites?: BoolParam;
  is_beta_tester?: BoolParam;
  suspension?: SuspensionFilter;
  is_active?: BoolParam;
  nationality?: number;
};

/** The full filter state the Users page owns and syncs to the URL. */
export type UserListFilters = Pick<
  UserListParams,
  'search' | 'ordering' | 'page' | 'is_online' | 'favourite_game' | 'has_favourites' | 'is_beta_tester' | 'suspension' | 'is_active'
>;
