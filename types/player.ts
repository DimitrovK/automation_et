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
  typeOfTransfer: "loan" | "permanent"
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
}

export interface PlayerConfiguration {
  show_date_of_birth_on_search: boolean
  retired: boolean
  might_change: boolean
  available_for_career_path: boolean
  career_path_difficulty: "EASY" | "NORMAL" | "HARD" | "EXTREME"
}
