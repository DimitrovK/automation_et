export interface Team {
  teamName: string
  originalTeamName: string
  appearances: number
  goals: number
  joinYear: number
  departYear: number | null
  position: string
  playerName: string
  dateOfBirth: string
  teamFound: boolean
  teamID: number | null
  TeamNameDB?: string
  typeOfTransfer: string
}

export interface DbPlayerInfo {
  retired: boolean
  is_player: boolean
  is_manager: boolean
  might_change: boolean
  available_for_career_path: boolean
  career_path_difficulty: "EASY" | "NORMAL" | "HARD" | "EXTREME"
  show_date_of_birth_on_search: boolean
  date_of_birth: string
  nation: {
    id: number
    name: string
    nationality: string
    short: string
  }
}

export interface PlayerData {
  playerName: string
  playerFoundInDB: boolean
  dateOfBirth: string
  birthCountry: string
  countryFoundInDB: boolean
  countryID: number | null
  position: string
  totalAppearances: number
  totalGoals: number
  summary: {
    totalTeams: number
    foundTeams: number
    notFoundTeams: number
  }
  teams: Team[]
  dbPlayerInfo?: DbPlayerInfo
}

export interface PlayerConfiguration {
  show_date_of_birth_on_search: boolean
  retired: boolean
  might_change: boolean
  available_for_career_path: boolean
  career_path_difficulty: "EASY" | "NORMAL" | "HARD" | "EXTREME"
}

// Django API Types
export interface FootballerTeam {
  id: number
  footballer_id: number
  footballer_name: string
  team_id: number
  team_name: string
  role: "player" | "manager"
  apps: number
  goals: number
  transfer_type: "permanent" | "loan"
  start_year: number
  end_year: number | null
  created_at: string
  updated_at: string
}

export interface FootballerNation {
  id: number
  name: string
  nationality: string
  short: string
}

export interface Footballer {
  id: number
  status: string
  user: number
  first_name: string
  last_name: string
  full_name: string
  nation: FootballerNation
  date_of_birth: string
  show_date_of_birth_on_search: boolean
  retired: boolean
  is_player: boolean
  is_manager: boolean
  might_change: boolean
  available_for_career_path: boolean
  career_path_difficulty: string
  teams_played_for: FootballerTeam[]
  teams_managed: FootballerTeam[]
  created_at: string
  updated_at: string
}

export interface FootballersResponse {
  count: number
  next: string | null
  previous: string | null
  results: Footballer[]
}

export interface CreateFootballerRequest {
  status: string
  user: number
  first_name: string
  last_name: string
  nation_id: number
  date_of_birth: string
  show_date_of_birth_on_search: boolean
  retired: boolean
  is_player: boolean
  is_manager: boolean
  might_change: boolean
  available_for_career_path: boolean
  career_path_difficulty: string
}

// Footballer Teams API Types
export interface CreateFootballerTeamRequest {
  footballer_id: number
  team_id: number
  role: "player" | "manager"
  apps: number
  goals: number
  transfer_type: "permanent" | "loan"
  start_year: number
  end_year?: number | null
}

export interface FootballerTeamsResponse extends Array<FootballerTeam> {}
