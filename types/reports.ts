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

export type ActivityDay = {
  date: string;
  /** False = never computed. NOT the same as zero activity. */
  covered: boolean;
} & ActivityMetrics;

export type Coverage = {
  complete: boolean;
  uncovered_days: string[];
  covered_days: number;
};

export type ActivityResponse = {
  /** Echoes the bucket size used, so a chart can label its axis correctly. */
  granularity: Granularity;
  coverage: Coverage;
  totals: ActivityMetrics;
  series: ActivityDay[];
} & ResolvedRange;

/** One headline metric: today, against the same-weekday baseline. */
export type PulseMetric = {
  /** The whole-day figure — "on track for X", as opposed to "normal so far". */
  baseline_full_day: number | null;
  today: number;
  yesterday: number;
  /** Mean of the previous N same weekdays. */
  /** Null when the baseline period has uncovered days. */
  baseline_same_weekday: number | null;
  /** Null when the baseline is 0 and today is 0 — i.e. no meaningful comparison. */
  delta_pct_vs_baseline: number | null;
};

export type Pulse = {
  date: string;
  weekday: string;
  baseline_weeks: number;
  /** False when a baseline day was never rolled up — show "no baseline", not 0. */
  baseline_covered: boolean;
  baseline_missing_days: string[];
  /**
   * How much of a typical day has happened, 0..1 — from the observed hour
   * distribution, not the clock. The baseline is scaled by it so today-so-far
   * is compared with the same share of a typical day rather than four whole ones.
   */
  elapsed_share: number;
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

export type MetricComparison = {
  current: number;
  previous: number;
  change: number;
  /** Null when a period has gaps, or the previous period was zero. */
  change_pct: number | null;
};

export type PeriodComparison = {
  current: { start: string; end: string; days: number };
  previous: { start: string; end: string; days: number };
  coverage: {
    complete: boolean;
    missing_current_days: string[];
    missing_previous_days: string[];
  };
  metrics: Record<keyof ActivityMetrics, MetricComparison>;
};

export type SummaryResponse = {
  pulse: Pulse;
  /** False when the range doesn't end today — the pulse describes today only. */
  pulse_applies: boolean;
  comparison: PeriodComparison;
  window_totals: ActivityMetrics;
  by_game: GameTotals[];
} & ResolvedRange;

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
  /** Always 'rooms' — a reminder this is a different grain from mp_player_sessions. */
  grain: string;
  totals: Omit<MultiplayerGameRow, 'game_type'>;
  by_game: MultiplayerGameRow[];
  by_mode: MultiplayerModeRow[];
} & ResolvedRange;

export type TopPlayer = {
  user_id: number;
  username: string;
  games_played: number;
  games_finished: number;
  /**
   * How many of those sessions were played against other people. Solo is the
   * difference — derived, never sent, so the two can't disagree with the total.
   * Optional so a backend predating it shows no split rather than claiming 0.
   */
  mp_sessions?: number;
  distinct_games: number;
  games: string[];
};

export type TopPlayersResponse = {
  limit: number;
  /** Echoed so an empty list reads as "no matches" rather than "no data". */
  search: string | null;
  players: TopPlayer[];
} & ResolvedRange;

/**
 * Windows the BE accepts (ALLOWED_WINDOWS in core/reporting_views.py).
 *
 * 1 is here so "today" is a preset rather than two identical dates picked by
 * hand. It is rendered as a named button, not as "1d" — see `RangePicker`.
 */
export const REPORT_WINDOWS = [1, 7, 10, 15, 30, 60, 90] as const;
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
  /** Anomaly knobs. Bounded server-side; out-of-range values are rejected. */
  min_volume?: number;
  min_change_pct?: number;
  /** Bucket size for the activity series. Rejected server-side if unknown. */
  granularity?: Granularity;
  /** Username fragment, case-insensitive. Narrows who is counted, not who survives. */
  search?: string;
};

/**
 * Buckets the activity series can be rolled up into.
 *
 * Server-side, because distinct players are not additive: a week's figure has
 * to be computed, not summed from its days.
 */
export type Granularity = 'day' | 'week' | 'month';

export const GRANULARITIES: Granularity[] = ['day', 'week', 'month'];

/**
 * The part of the echo every range-filtered response carries, including the
 * player drill-down (which has no game/bot filter to echo back).
 */
export type WindowEcho = {
  start: string;
  end: string;
  days: number;
  window: number;
};

/** Filter echo every game-filtered reporting response carries. */
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

/**
 * One weekday of the heatmap. `hours` is always 24 long — the BE sends it
 *  dense so a gap can never be misread as a quiet hour.
 */
export type HourWeekdayRow = {
  weekday: number;
  name: string;
  hours: number[];
};

export type PeakCell = {
  weekday: number;
  name: string;
  hour: number;
  games_started: number;
};

export type PatternsResponse = {
  timezone: string;
  by_hour: HourRow[];
  by_weekday: WeekdayRow[];
  by_hour_weekday: HourWeekdayRow[];
  /**
   * Busiest single slot. Null when the window has no activity at all — the
   *  argmax of an all-zero grid would otherwise render as a real finding.
   */
  peak_cell: PeakCell | null;
  busiest_cell_games: number;
  peak_hour: number | null;
  peak_weekday: string | null;
  new_vs_returning: NewReturningRow[];
} & ResolvedRange;

export type PlayerGameRow = {
  game_type: string;
  games_played: number;
  games_finished: number;
  completion_pct: number;
  /** Multiplayer sessions in this game. Solo is games_played minus this. */
  mp_sessions?: number;
};

export type PlayerDetailResponse = {
  user_id: number;
  username: string;
  is_bot: boolean;
  date_joined: string;
  totals: {
    games_played: number;
    games_finished: number;
    completion_pct: number | null;
    distinct_games: number;
    mp_sessions?: number;
    /**
     * Share of this player's sessions played against other people. Null when
     * they played nothing — 0% would claim they played solo.
     */
    mp_share_pct?: number | null;
    active_days: number;
    active_days_pct: number | null;
    games_per_active_day: number | null;
  };
  favourite_game: string | null;
  by_game: PlayerGameRow[];
  series: { date: string; games_started: number; games_finished: number }[];
} & WindowEcho;

/** Display metadata from the BE registry — the single source of truth for colours. */
export type GameMeta = {
  key: string;
  label: string;
  /**
   * The game's own name — "Grid", not "Grid Game Sessions". Use this wherever a
   * game is named; `label` is a dashboard card title that reads as a metric.
   * Optional so a backend predating it degrades to `label` rather than to a slug.
   */
  display_name?: string;
  /**
   * The same game's id in the FRONTEND's vocabulary — the kebab slug stored in
   * `User.favourite_games` ("line-up-game" for missing11, "tenagoal" for
   * tenable). A second naming system, not a formatting of `key`, so favourites
   * data can only be joined to this registry through it. Optional so a backend
   * predating it leaves favourites uncoloured rather than breaking the page.
   */
  favourite_slug?: string;
  /** Hex for a light surface. Same colour the Django admin dashboard draws the game with. */
  color: string;
  /**
   * Hex for a dark surface — the same hue re-stepped, not a computed flip.
   * Optional so the UI keeps working against a BE that predates it.
   */
  color_dark?: string;
};

export type GamesResponse = { games: GameMeta[] };

/** A metric explained, from the BE registry that sits beside the query. */
export type MetricDefinition = {
  key: string;
  label: string;
  counts: string;
  /** Empty string when nothing is excluded — that is a claim too, not a gap. */
  excludes: string;
  /** How the number can be misread. Empty when there is genuinely no trap. */
  caveat: string;
  related: string[];
};

export type GlossaryResponse = { metrics: MetricDefinition[] };

/** State of the rollup every report is built on. Not range-filtered. */
export type RollupHealth = {
  has_data: boolean;
  earliest: string | null;
  latest: string | null;
  days_covered: number;
  gap_count: number;
  /** Capped server-side; `gaps_truncated` says when there are more. */
  gaps: string[];
  gaps_truncated: boolean;
  /** Days behind yesterday. Null when nothing has ever been computed. */
  stale_days: number | null;
  /** The exact backfill command, or null when there is nothing to run. */
  suggested_command: string | null;
};

/** Which activity metric a chart or table is currently showing. */
export const METRIC_OPTIONS = [
  { key: 'games_started', label: 'Played' },
  { key: 'games_finished', label: 'Finished' },
  { key: 'distinct_players', label: 'Players' },
  { key: 'mp_player_sessions', label: 'Multiplayer' },
] as const;

export type MetricKey = (typeof METRIC_OPTIONS)[number]['key'];

export type RetentionCell = { returned: number; pct: number | null };

export type RetentionCohort = {
  date: string;
  cohort_size: number;
  /** True for the window's first day, whose "new" cohort is mostly veterans. */
  inflated: boolean;
  /** Null when the cohort hasn't reached that offset yet — NOT 0%. */
  retention: Record<string, RetentionCell | null>;
};

export type RetentionSummaryCell = {
  cohorts_measured: number;
  players: number;
  returned: number;
  pct: number | null;
};

export type RetentionResponse = {
  /** States what "new" means here — a window return rate, not lifetime retention. */
  basis: string;
  first_cohort_inflated: boolean;
  offsets: number[];
  summary: Record<string, RetentionSummaryCell>;
  cohorts: RetentionCohort[];
} & ResolvedRange;

export type DurationRow = {
  game_type: string;
  /** False when the game records no session end time at all. */
  supported: boolean;
  reason: string | null;
  sessions: number;
  measured: number;
  /** Share of finished sessions that could be measured — varies 69%-100%. */
  coverage_pct: number | null;
  median_seconds: number | null;
  p90_seconds: number | null;
  long_sessions: number;
  long_sessions_pct: number | null;
  /** False for campaign-shaped games whose "session" spans a day, not a sitting. */
  single_sitting: boolean | null;
  /**
   * Seconds of idleness after which a sweeper task closes an unfinished session,
   * or null for games with no such job. Optional because a backend predating
   * these fields sends none of them — such a row explains nothing rather than
   * guessing which of two opposite explanations applies.
   */
  idle_finish_seconds?: number | null;
  /** Measured sessions sitting at or past that ceiling — timed by the sweeper. */
  swept_sessions?: number;
  swept_pct?: number | null;
  /**
   * Median among sessions that ended by play rather than by the sweeper. For a
   * swept game this is the only comparable number it has.
   */
  median_excluding_swept_seconds?: number | null;
  /**
   * Why the sessions are long. 'idle_sweep' means the length is a housekeeping
   * job's clock; 'long_play' means the game really is played in long stretches.
   * A median cannot tell these apart, and they mean opposite things.
   */
  long_reason?: 'idle_sweep' | 'long_play' | null;
};

export type DurationResponse = {
  long_session_seconds: number;
  games_without_duration: string[];
  long_lived_session_games: string[];
  /** Longest among comparable games only — a campaign game would win by default. */
  longest_single_sitting_game: string | null;
  rows: DurationRow[];
} & ResolvedRange;

export type AnomalyFinding = {
  scope: 'platform' | 'game';
  game_type: string | null;
  metric: string;
  /** Null for findings that aren't a change (e.g. a low completion rate). */
  change_pct: number | null;
  current: number;
  previous: number | null;
  severity: 'high' | 'medium';
  headline: string;
  detail: string;
};

export type AnomaliesResponse = {
  window_days: number;
  compared_with: { start: string; end: string };
  /** Returned so a reader can see what was filtered out, not just what survived. */
  thresholds: {
    min_volume: number;
    min_change_pct: number;
    severe_change_pct: number;
  };
  /** Lets an empty list mean "nothing moved" rather than "we couldn't tell". */
  coverage: { complete: boolean; missing_days: string[] };
  findings: AnomalyFinding[];
} & ResolvedRange;
