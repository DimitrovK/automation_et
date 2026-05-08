export type Team = {
  teamName: string;
  originalTeamName: string;
  appearances: number;
  goals: number;
  joinYear: number;
  departYear: number | null;
  position: string;
  playerName: string;
  dateOfBirth: string;
  teamFound: boolean;
  teamID: number | null;
  TeamNameDB?: string;
  typeOfTransfer: string;
};

export type NationalTeam = {
  teamName: string;
  startYear: number;
  endYear: number | null;
  apps: number;
  goals: number;
  nationFound: boolean;
  nationID: number | null;
  nationNameDB: string | null;
};

export type n8nWikiPlayerData = {
  playerName: string;
  playerFoundInDB: boolean;
  playerDBId: number | null;
  dateOfBirth: string;
  birthCountry: string;
  countryFoundInDB: boolean;
  countryID: number | null;
  position: string;
  totalAppearances: number;
  totalGoals: number;
  summary: {
    totalTeams: number;
    foundTeams: number;
    notFoundTeams: number;
  };
  teams: Team[];
  nationalTeams?: NationalTeam[];
  positionsTracker?: PositionsTracker;
};

export type PlayerConfiguration = {
  // Configuration settings
  status: 'AWAITING_REVISION' | 'APPROVED' | 'DENIED' | 'AWAITING_CHANGE_CHECK';
  show_date_of_birth_on_search: boolean;
  retired: boolean;
  is_player: boolean;
  is_manager: boolean;
  might_change: boolean;
  available_for_career_path: boolean;
  available_for_grid: boolean;
  available_for_scout: boolean;
  career_path_difficulty: 'EASY' | 'NORMAL' | 'HARD' | 'EXTREME';

  // Player data fields
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  nationality: string;
  countryID: number | null;
  wikipediaUrl: string;
};

// Django API Types
export type FootballerTeam = {
  id: number;
  footballer_id: number;
  footballer_name: string;
  team_id: number;
  team_name: string;
  role: 'player' | 'manager';
  /** Match the model: apps / goals / years are nullable. */
  apps: number | null;
  goals: number | null;
  transfer_type: 'permanent' | 'loan';
  start_year: number | null;
  end_year: number | null;
  created_at: string;
  updated_at: string;
};

export type FootballerNation = {
  id: number;
  name: string;
  nationality: string;
  short: string;
};

export type FootballerPicture = {
  id: number;
  footballer_id?: number;
  footballer_name?: string;
  image_url: string | null;
  thumbnail_url: string | null;
  name: string;
  slug: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// ``Position`` and ``FootballerPosition`` types are declared further
// down — both came from PR #25 (position-management). Don't redeclare
// them here.

export type CareerPathDifficulty = 'EASY' | 'NORMAL' | 'HARD' | 'EXTREME';
export type FootballerStatus = 'AWAITING_REVISION' | 'APPROVED' | 'DENIED' | 'AWAITING_CHANGE_CHECK';

export type Footballer = {
  id: number;
  status: FootballerStatus;
  user: number;
  first_name: string;
  last_name: string;
  full_name: string;
  nation: FootballerNation;
  /** Secondary nationalities (M2M, dual citizenship). Empty array if none. */
  other_nations: FootballerNation[];
  date_of_birth: string;
  wikipedia_url: string | null;
  show_date_of_birth_on_search: boolean;
  retired: boolean;
  is_player: boolean;
  is_manager: boolean;
  might_change: boolean;
  available_for_career_path: boolean;
  available_for_grid: boolean;
  available_for_scout: boolean;
  career_path_difficulty: CareerPathDifficulty;
  teams_played_for: FootballerTeam[];
  teams_managed: FootballerTeam[];
  /** Populated when retrieved with ?include=positions; null otherwise. */
  positions: FootballerPosition[] | null;
  /** Populated when retrieved with ?include=pictures; null otherwise. */
  pictures: FootballerPicture[] | null;
  /** Populated when retrieved with ?include=nations; null otherwise. */
  national_stats: FootballerNationStat[] | null;
  additional_info: string | null;
  created_at: string;
  updated_at: string;
};

export type FootballersResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Footballer[];
};

export type CreateFootballerRequest = {
  status: FootballerStatus;
  user?: number;
  first_name?: string;
  last_name: string;
  nation_id: number;
  /** Secondary nation ids for dual citizenship. */
  other_nation_ids?: number[];
  date_of_birth: string;
  wikipedia_url?: string | null;
  show_date_of_birth_on_search: boolean;
  retired: boolean;
  is_player: boolean;
  is_manager: boolean;
  might_change: boolean;
  available_for_career_path: boolean;
  available_for_grid: boolean;
  available_for_scout: boolean;
  career_path_difficulty: CareerPathDifficulty;
  additional_info?: string | null;
};

/** Fields the bulk-update endpoint accepts. Subset of CreateFootballerRequest
 *  — admin-tweakable flags, no identity / DoB / nation. */
export type FootballerBulkUpdates = Partial<{
  status: FootballerStatus;
  retired: boolean;
  is_player: boolean;
  is_manager: boolean;
  might_change: boolean;
  available_for_career_path: boolean;
  available_for_grid: boolean;
  available_for_scout: boolean;
  career_path_difficulty: CareerPathDifficulty;
}>;

export type FootballerBulkUpdateResponse = {
  updated: number;
  ids: number[];
  applied: FootballerBulkUpdates;
};

/** Optional include tokens for `GET /data/footballers/<id>/?include=...` */
export type FootballerIncludeToken = 'teams' | 'nations' | 'positions' | 'pictures';

// Footballer Teams API Types
export type CreateFootballerTeamRequest = {
  footballer_id: number;
  team_id: number;
  role: 'player' | 'manager';
  apps: number;
  goals: number;
  transfer_type: 'permanent' | 'loan';
  start_year: number;
  end_year?: number | null;
};

export type FootballerTeamsResponse = {} & Array<FootballerTeam>;

// Footballer Nation Stats API Types
export type FootballerNationStat = {
  id: number;
  footballer_id: number;
  footballer_name: string;
  nation_id: number;
  nation_name: string;
  apps: number;
  goals: number;
  created_at: string;
  updated_at: string;
};

export type CreateFootballerNationRequest = {
  footballer_id: number;
  nation_id: number;
  apps: number;
  goals: number;
};

// Position API types (from /data/positions/)
export type Position = {
  id: number;
  name: string;
  full_name: string;
  role: 'GK' | 'DEF' | 'MID' | 'FWD';
  sort_order: number;
};

// FootballerPosition API types (from /data/footballer-positions/)
export type FootballerPosition = {
  id: number;
  footballer_id: number;
  footballer_name: string;
  position_id: number;
  position_name: string;
  position_full_name: string;
  position_role: string;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

// Request type for set-positions bulk endpoint
export type SetPositionsRequest = {
  footballer_id: number;
  positions: Array<{
    position_id: number;
    is_primary: boolean;
    sort_order?: number;
  }>;
};

// positionsTracker from n8n webhook
export type PositionsTracker = {
  hasDiscrepancy: boolean;
  databasePositions: Array<{ id: number; name: string; fullName: string; isPrimary: boolean }>;
  databaseHasPositions: boolean;
  wikipediaPositions: Array<{ id: number; name: string; fullName: string; originalWikipediaName: string }>;
  missingInDatabase: Array<{ id: number; name: string; fullName: string; originalWikipediaName: string }>;
  missingIdsToApply: number[];
  message: string;
};
