// Types for the staff-only Reports section.
// Field names mirror the Django BE payloads from `/core/reporting/*` — keep them
// in sync if `core/reporting_views.py` changes.

/** The four metrics every activity payload carries. */
export type ActivityMetrics = {
  games_started: number;
  games_finished: number;
  distinct_players: number;
  /** Multiplayer participations (per player). Solo = games_started - this. */
  mp_player_sessions: number;
};

export type ActivityDay = { date: string } & ActivityMetrics;

export type ActivityResponse = {
  start: string;
  end: string;
  window: number;
  game_type: string | null;
  include_bots: boolean;
  totals: ActivityMetrics;
  series: ActivityDay[];
};

/** One headline metric: today, against the same-weekday baseline. */
export type PulseMetric = {
  today: number;
  yesterday: number;
  /** Mean of the previous N same weekdays. */
  baseline_same_weekday: number;
  /** Null when the baseline is 0 and today is 0 — i.e. no meaningful comparison. */
  delta_pct_vs_baseline: number | null;
};

export type Pulse = {
  date: string;
  weekday: string;
  baseline_weeks: number;
  metrics: Record<keyof ActivityMetrics, PulseMetric>;
};

export type GameTotals = {
  game_type: string;
  /** finished / started. Null when nobody played — 0% would read as "everyone bailed". */
  completion_pct: number | null;
  sessions_per_player: number | null;
  /** Share of platform volume. Null when the platform had no activity at all. */
  share_pct: number | null;
  repeat_players: number;
  /** Share of this game's players who came back on ANOTHER day. */
  repeat_rate_pct: number | null;
  previous_games_started: number;
  /** vs the immediately preceding window. */
  trend_pct: number | null;
} & ActivityMetrics;

export type SummaryResponse = {
  pulse: Pulse;
  window: number;
  game_type: string | null;
  window_totals: ActivityMetrics;
  by_game: GameTotals[];
  include_bots: boolean;
};

export type MultiplayerGameRow = {
  game_type: string;
  rooms_created: number;
  rooms_started: number;
  rooms_finished: number;
  rooms_cancelled: number;
  never_started_pct: number;
};

/** One row of the multiplayer funnel split by mode. Quiz has no mode column. */
export type MultiplayerModeRow = {
  game_type: string;
  mode: string | null;
  rooms_created: number;
  rooms_started: number;
  rooms_finished: number;
};

export type MultiplayerResponse = {
  start: string;
  end: string;
  window: number;
  game_type: string | null;
  include_bots: boolean;
  /** Always 'rooms' — a reminder this is a different grain from mp_player_sessions. */
  grain: string;
  totals: Omit<MultiplayerGameRow, 'game_type'>;
  by_game: MultiplayerGameRow[];
  by_mode: MultiplayerModeRow[];
};

export type TopPlayer = {
  user_id: number;
  username: string;
  games_played: number;
  games_finished: number;
  distinct_games: number;
  games: string[];
};

export type TopPlayersResponse = {
  start: string;
  end: string;
  window: number;
  game_type: string | null;
  include_bots: boolean;
  limit: number;
  players: TopPlayer[];
};

/** Windows the BE accepts (ALLOWED_WINDOWS in core/reporting_views.py). */
export const REPORT_WINDOWS = [7, 10, 15, 30, 60, 90] as const;
export type ReportWindow = (typeof REPORT_WINDOWS)[number];

export type ReportParams = {
  window?: ReportWindow;
  /** YYYY-MM-DD. Takes precedence over `window` server-side. */
  start?: string;
  /** YYYY-MM-DD, inclusive. Defaults to today when `start` is given. */
  end?: string;
  game_type?: string;
  include_bots?: boolean;
  limit?: number;
};

/** Filter echo every reporting response carries. */
export type ResolvedRange = {
  start: string;
  end: string;
  days: number;
  window: number;
  game_type: string | null;
  include_bots: boolean;
};

export type HourRow = { hour: number; games_started: number };
export type WeekdayRow = { weekday: number; name: string; games_started: number };
export type NewReturningRow = {
  date: string;
  new_players: number;
  returning_players: number;
  total_players: number;
};

export type PatternsResponse = {
  timezone: string;
  by_hour: HourRow[];
  by_weekday: WeekdayRow[];
  peak_hour: number | null;
  peak_weekday: string | null;
  new_vs_returning: NewReturningRow[];
} & ResolvedRange;

export type PlayerGameRow = {
  game_type: string;
  games_played: number;
  games_finished: number;
  completion_pct: number;
};

export type PlayerDetailResponse = {
  user_id: number;
  username: string;
  is_bot: boolean;
  date_joined: string;
  start: string;
  end: string;
  days: number;
  window: number;
  totals: {
    games_played: number;
    games_finished: number;
    completion_pct: number | null;
    distinct_games: number;
    active_days: number;
    active_days_pct: number | null;
    games_per_active_day: number | null;
  };
  favourite_game: string | null;
  by_game: PlayerGameRow[];
  series: { date: string; games_started: number; games_finished: number }[];
};

/** Display metadata from the BE registry — the single source of truth for colours. */
export type GameMeta = {
  key: string;
  label: string;
  /** Hex, e.g. '#2563eb'. Same colour the Django admin dashboard draws the game with. */
  color: string;
};

export type GamesResponse = { games: GameMeta[] };

/** Which activity metric a chart or table is currently showing. */
export const METRIC_OPTIONS = [
  { key: 'games_started', label: 'Played' },
  { key: 'games_finished', label: 'Finished' },
  { key: 'distinct_players', label: 'Players' },
  { key: 'mp_player_sessions', label: 'Multiplayer' },
] as const;

export type MetricKey = (typeof METRIC_OPTIONS)[number]['key'];
