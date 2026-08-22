// Types for the admin Team Players lookup feature.
// Matches the shape returned by `GET /data/team/<id>/players/` and the
// existing `GET /data/team/search/?name=X`.

export type TeamSearchResult = {
  id: number;
  name: string;
};

export type TeamHeaderInfo = {
  id: number;
  name: string;
  nation_name: string | null;
  nation_short: string | null;
  founding_year: number | null;
  parent_team_name: string | null;
  total_players: number;
  total_managers: number;
};

export type PlayerRole = 'player' | 'manager';
export type TransferType = 'permanent' | 'loan';
export type CareerPathDifficulty = 'EASY' | 'NORMAL' | 'HARD' | 'EXTREME';

export type TeamPlayerRow = {
  id: number; // FootballerTeam (stint) id
  footballer_id: number;
  full_name: string;
  nation_id: number | null;
  nation_name: string | null;
  nation_short: string | null;
  retired: boolean;
  career_path_difficulty: CareerPathDifficulty;
  role: PlayerRole;
  start_year: number | null;
  end_year: number | null;
  apps: number | null;
  goals: number | null;
  transfer_type: TransferType;
};

export type PaginatedPlayers = {
  count: number;
  next: string | null;
  previous: string | null;
  results: TeamPlayerRow[];
};

export type TeamPlayersResponse = {
  team: TeamHeaderInfo;
  players: PaginatedPlayers;
};

export type RoleFilter = PlayerRole | 'all';
export type TransferFilter = TransferType | 'all';
export type StatusFilter = 'active' | 'retired' | 'all';

export type TeamPlayersOrdering
  = | 'start_year' | '-start_year'
    | 'full_name' | '-full_name'
    | 'apps' | '-apps'
    | 'goals' | '-goals';

/** A country's roster header — both counts, because they differ. */
export type NationHeaderInfo = {
  id: number;
  name: string;
  short: string;
  flag: string | null;
  /** Distinct people. What the analytics tile counts. */
  total_footballers: number;
  /** Rows in the list, which is the larger number and not a contradiction. */
  total_spells: number;
  total_clubs: number;
};

/**
 * One footballer and every spell they had inside the current scope.
 *
 * Grouped server-side: paging the spells and grouping what came back would
 * split a person across pages.
 */
export type GroupedPlayer = {
  footballer_id: number;
  full_name: string;
  nation_id: number | null;
  nation_name: string | null;
  nation_short: string | null;
  retired: boolean;
  career_path_difficulty: string | null;
  spell_count: number;
  /** Summed across the spells in scope — not the best single one. */
  total_apps: number;
  total_goals: number;
  first_year: number | null;
  last_year: number | null;
  spells: TeamPlayerRow[];
};

export type PaginatedGroupedPlayers = {
  count: number;
  next: string | null;
  previous: string | null;
  results: GroupedPlayer[];
};

export type NationPlayersResponse = {
  nation: NationHeaderInfo;
  /** Grouped when `group_by=footballer` was asked for, spells otherwise. */
  players: PaginatedPlayers | PaginatedGroupedPlayers;
};

/**
 * Query params for a stint roster, whichever subject scopes it.
 *
 * `nation_id` is the FOOTBALLER's nationality — on the nation roster that is a
 * different thing from the country the stint was in, which is what makes
 * "Brazilians who played in England" expressible.
 */
export type RosterParams = {
  /** `footballer` returns one row per person, each carrying its spells. */
  group_by?: 'footballer';
  role?: RoleFilter;
  transfer_type?: TransferFilter;
  status?: StatusFilter;
  start_year_gte?: number;
  start_year_lte?: number;
  nation_id?: number;
  q?: string;
  ordering?: TeamPlayersOrdering;
  page?: number;
  page_size?: number;
};

/** The team roster's params. One shape, kept under its old name for callers. */
export type TeamPlayersParams = RosterParams;
