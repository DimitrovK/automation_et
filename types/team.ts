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
  id: number;            // FootballerTeam (stint) id
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

export type TeamPlayersOrdering =
  | 'start_year' | '-start_year'
  | 'full_name' | '-full_name'
  | 'apps' | '-apps'
  | 'goals' | '-goals';

export type TeamPlayersParams = {
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
